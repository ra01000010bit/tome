import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, renameSync, unlinkSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = process.env.TOME_DATA_DIR || join(__dirname, 'data');
const PORT      = Number(process.env.PORT || 5050);
const IS_PROD   = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGIN = process.env.TOME_ORIGIN || (IS_PROD ? null : '*');

// ── Auth modell ──────────────────────────────────────────────────────────────
//
// Új modell (2026-05-08 óta):
//   - A felhasználó a UserGate-en megadja a nevét.
//   - A szerver random tokent generál és eltárolja a `users.json`-ban
//     (név -> { token, createdAt }), valamint külön `state-<userId>.json`-t.
//   - Ha valaki ugyanazt a nevet adja meg másik eszközről, a /register
//     előbb `status: 'exists'`-t ad vissza summary-vel; ha a felhasználó
//     megerősíti hogy az ő mentése, akkor `claim: true`-val visszahívja
//     és megkapja a tokent.
//
// Legacy: az TOME_USERS env-ből beolvasott statikus token-mapping továbbra
// is működik (visszafelé kompatibilis), de új user már a runtime
// registration-en jön be.

if (IS_PROD && !ALLOWED_ORIGIN) {
  console.error('FATAL: TOME_ORIGIN must be set in production (e.g. https://lla.fly.dev).');
  process.exit(1);
}

mkdirSync(DATA_DIR, { recursive: true });

// ── User registry (név -> token + meta) ──────────────────────────────────────

const USERS_FILE = join(DATA_DIR, 'users.json');
const VALID_USER_ID = /^[a-z0-9_-]+$/i;

// nameLower -> { userId, token, createdAt, displayName }
let userByNameLower = new Map();
// token -> userId
let tokenToUser = new Map();

function loadUsers() {
  userByNameLower = new Map();
  tokenToUser = new Map();
  if (!existsSync(USERS_FILE)) return;
  try {
    const data = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    for (const entry of data.users || []) {
      if (!entry?.userId || !entry?.token || !entry?.displayName) continue;
      const nameLower = String(entry.displayName).toLowerCase();
      userByNameLower.set(nameLower, entry);
      tokenToUser.set(entry.token, entry.userId);
    }
  } catch (e) {
    console.error('users.json load failed:', e.message);
  }
}

function persistUsers() {
  const tmp = `${USERS_FILE}.${process.pid}.tmp`;
  const list = [...userByNameLower.values()];
  try {
    writeFileSync(tmp, JSON.stringify({ users: list }, null, 2), 'utf-8');
    renameSync(tmp, USERS_FILE);
  } catch (e) {
    try { unlinkSync(tmp); } catch {}
    throw e;
  }
}

// Legacy TOME_USERS env: statikus name:token párokat tölt fel a registry-be
// induláskor. Ha az adott név nincs még a users.json-ban, hozzáadjuk —
// különben hagyjuk a már elmentett tokent (perzisztens nyer).
loadUsers();

// ── Per-user state storage ───────────────────────────────────────────────────

function statePathFor(userId) {
  return join(DATA_DIR, `state-${userId}.json`);
}

function readState(statePath) {
  if (!existsSync(statePath)) return null;
  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch (e) {
    console.error(`Corrupt state file ${statePath}:`, e.message);
    return null;
  }
}

function writeState(statePath, state, updatedAt) {
  // Atomic write: temp-fájl + rename (POSIX atomic, Windowson is azonos köteten).
  const tmp = `${statePath}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, JSON.stringify({ state, updatedAt }, null, 2), 'utf-8');
    renameSync(tmp, statePath);
  } catch (e) {
    try { unlinkSync(tmp); } catch {}
    throw e;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugifyUserName(name) {
  if (typeof name !== 'string') return null;
  const cleaned = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return cleaned.length >= 2 ? cleaned : null;
}

function randomToken(bytes = 24) {
  return randomBytes(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function ensureUniqueUserId(baseSlug) {
  // Ha már van ugyanezzel a slug-gal user (pl. két "Lili" más PIN nélkül),
  // ragasztunk egy 4-jegyű random suffixet.
  if (![...userByNameLower.values()].some((u) => u.userId === baseSlug)) return baseSlug;
  for (let i = 0; i < 10; i++) {
    const suffix = randomBytes(2).toString('hex');
    const candidate = `${baseSlug}-${suffix}`;
    if (![...userByNameLower.values()].some((u) => u.userId === candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

function summarizeForUser(entry) {
  const stored = readState(statePathFor(entry.userId));
  const s = stored?.state || {};
  const unlockedMap = s.unlockedCards && typeof s.unlockedCards === 'object'
    ? s.unlockedCards : {};
  const unlockedCards = Object.entries(unlockedMap).map(([id, val]) => ({
    id,
    level: typeof val === 'object' ? (val?.level || 1) : (Number(val) || 1),
  }));
  const qs = s.questionStates && typeof s.questionStates === 'object' ? s.questionStates : {};
  let mastered = 0, seen = 0;
  for (const k of Object.keys(qs)) {
    seen++;
    const item = qs[k];
    if (item && item.state === 'review' && (item.stability || 0) >= 7) mastered++;
  }
  return {
    displayName: entry.displayName,
    unlockedCount: unlockedCards.length,
    unlockedCards,
    questionsSeen: seen,
    questionsMastered: mastered,
    lastSync: stored?.updatedAt || 0,
  };
}

// ── Per-mező state merge (két-eszköz fork ellen) ─────────────────────────────
//
// A régi protokoll "last-write-wins" volt: aki utoljára push-olt, mindenét
// felülírta. Két eszközös offline használatnál ez adatvesztést okozott
// (audit 4.1, medium-risk). Az új merge per-mező:
//
//   - Vector Clock alapú konfliktus-feloldás: ha egyértelmű a sorrend, a frissebb nyer.
//   - Ha "concurrent" (ütközés), akkor marad a per-mező merge:
//     questionStates[qid]   → az újabb lastReviewed nyer (per-kérdés)
//     unlockedCards[id]   → magasabb level nyer (level-szám = haladás)
//     topicProgress[id]     → bestScore=max, completionCount=max, lastCompleted=max
//     cardOrder           → union (a sorrend megőrizve, kliens új elemei a végén)
//     starterClaimed        → OR
//     settings              → last-push nyer (kliens tudatos választása)
//     userName / deviceId   → kliens nyer
//
function mergeStates(serverState, clientState) {
  const a = serverState || {};
  const b = clientState || {};

  const clockA = a.vectorClock || {};
  const clockB = b.vectorClock || {};
  const devices = new Set([...Object.keys(clockA), ...Object.keys(clockB)]);
  
  let aIsBigger = false;
  let bIsBigger = false;
  const mergedClock = {};
  
  for (const d of devices) {
    const valA = clockA[d] || 0;
    const valB = clockB[d] || 0;
    if (valA > valB) aIsBigger = true;
    if (valB > valA) bIsBigger = true;
    mergedClock[d] = Math.max(valA, valB);
  }

  // Ha tisztán az egyik frissebb, vagy egyenlőek, akkor azt vesszük át
  if (bIsBigger && !aIsBigger) return { ...b, vectorClock: mergedClock };
  if (aIsBigger && !bIsBigger) return { ...a, vectorClock: mergedClock };
  if (!aIsBigger && !bIsBigger) return { ...b, vectorClock: mergedClock };

  // Concurrent (ütközés): szemantikus mezőnkénti merge
  // questionStates: per-kérdés a frissebb lastReviewed nyer
  const qs = { ...(a.questionStates || {}) };
  for (const [k, v] of Object.entries(b.questionStates || {})) {
    const existing = qs[k];
    if (!existing) { qs[k] = v; continue; }
    if ((v?.lastReviewed || 0) > (existing?.lastReviewed || 0)) qs[k] = v;
  }

  // unlockedCards: per-ló, magasabb level nyer
  const unlocked = { ...(a.unlockedCards || {}) };
  for (const [k, v] of Object.entries(b.unlockedCards || {})) {
    const existing = unlocked[k];
    if (!existing) { unlocked[k] = v; continue; }
    const lvlA = typeof existing === 'object' ? (existing?.level || 1) : (Number(existing) || 1);
    const lvlB = typeof v === 'object' ? (v?.level || 1) : (Number(v) || 1);
    if (lvlB > lvlA) unlocked[k] = v;
  }

  // topicProgress: per-topic, mező-szinten max
  const tp = { ...(a.topicProgress || {}) };
  for (const [k, v] of Object.entries(b.topicProgress || {})) {
    const existing = tp[k];
    if (!existing) { tp[k] = v; continue; }
    tp[k] = {
      bestScore: Math.max(existing.bestScore || 0, v.bestScore || 0),
      completionCount: Math.max(existing.completionCount || 0, v.completionCount || 0),
      lastCompleted: Math.max(existing.lastCompleted || 0, v.lastCompleted || 0),
    };
  }

  // cardOrder: union, server sorrendje megtartva, kliens új elemei a végére
  const orderA = Array.isArray(a.cardOrder) ? a.cardOrder : [];
  const orderB = Array.isArray(b.cardOrder) ? b.cardOrder : [];
  const seen = new Set(orderA);
  const order = [...orderA];
  for (const x of orderB) if (!seen.has(x)) { order.push(x); seen.add(x); }

  return {
    userName: b.userName || a.userName || null,
    deviceId: b.deviceId || a.deviceId || null,
    questionStates: qs,
    topicProgress: tp,
    unlockedCards: unlocked,
    cardOrder: order,
    starterClaimed: Boolean(a.starterClaimed || b.starterClaimed),
    vectorClock: mergedClock,
    settings: { ...(a.settings || {}), ...(b.settings || {}) },
  };
}

// ── Express app ──────────────────────────────────────────────────────────────

const app = express();
// Fly.io proxy küld X-Forwarded-For headert. Trust-olnunk kell, különben
// az express-rate-limit ValidationError-t dob és crashel.
app.set('trust proxy', 1);
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '512kb', type: ['application/json', 'text/plain'] }));

function authed(req, res, next) {
  const t = req.get('x-tome-token') || req.query?.token;
  if (!t) return res.status(401).json({ error: 'unauthorized' });
  if (!tokenToUser.has(t)) return res.status(401).json({ error: 'unauthorized' });
  req.userId = tokenToUser.get(t);
  return next();
}

// Brute-force védelem a /register-en: 15 perces ablak, max 30 IP-nként.
// Védi az "exists" lookup-ot — különben név-listát lehetne enumerálni.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many requests' },
});

function isPlainObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

app.get('/health', (_, res) => res.json({ ok: true, time: Date.now() }));

// ── Registration / claim ─────────────────────────────────────────────────────

// POST /register { name, claim?: bool }
//
// Új user (nincs ilyen név):
//   { status: 'created', token, userId, displayName }
//
// Már létező név, claim != true:
//   { status: 'exists', summary: { displayName, unlockedCount, questionsSeen, questionsMastered, lastSync } }
//
// Már létező név, claim === true:
//   { status: 'claimed', token, userId, displayName }
//
// Érvénytelen név (üres / túl rövid / túl hosszú):
//   400
app.post('/register', registerLimiter, (req, res) => {
  const { name, claim } = req.body || {};
  if (typeof name !== 'string') return res.status(400).json({ error: 'name required' });
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 40) {
    return res.status(400).json({ error: 'name must be 2..40 chars' });
  }
  // Defense-in-depth: HTML-special karakter ne kerülhessen tárolt nevekbe.
  // Az admin HTML inline JS-ben már escape-elünk, ez egy második réteg.
  if (/[<>]/.test(trimmed)) {
    return res.status(400).json({ error: 'name contains invalid characters' });
  }
  const slug = slugifyUserName(trimmed);
  if (!slug) return res.status(400).json({ error: 'name has no valid characters' });

  const lower = trimmed.toLowerCase();
  const existing = userByNameLower.get(lower);

  if (existing) {
    if (claim === true) {
            return res.json({
        status: 'claimed',
        token: existing.token,
        userId: existing.userId,
        displayName: existing.displayName,
      });
    }
        return res.json({
      status: 'exists',
      summary: summarizeForUser(existing),
    });
  }

  const userId = ensureUniqueUserId(slug);
  const token = randomToken(24);
  const entry = {
    userId,
    displayName: trimmed,
    token,
    createdAt: Date.now(),
  };
  userByNameLower.set(lower, entry);
  tokenToUser.set(token, userId);
  try {
    persistUsers();
  } catch (e) {
    userByNameLower.delete(lower);
    tokenToUser.delete(token);
    return res.status(500).json({ error: 'persist failed' });
  }
    return res.json({ status: 'created', token, userId, displayName: trimmed });
});

// ── Sync ─────────────────────────────────────────────────────────────────────

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // 300 sync requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many sync requests' },
});

app.get('/sync', syncLimiter, authed, (req, res) => {
  const stored = readState(statePathFor(req.userId));
  if (!stored) return res.json({ state: null, updatedAt: 0 });
  res.json(stored);
});

app.post('/sync', syncLimiter, authed, (req, res) => {  const { state, clientUpdatedAt } = req.body || {};
  if (!isPlainObject(state)) return res.status(400).json({ error: 'invalid state' });
  if (!('questionStates' in state) || !('unlockedCards' in state)) {
    return res.status(400).json({ error: 'state missing expected keys' });
  }
  const path = statePathFor(req.userId);
  const stored = readState(path);
  const now = Date.now();

  // Új protokoll: mindig merge-elünk, soha nem rejectelünk. A kliens
  // megkapja a merged state-et és átveszi (kompatibilis a régi `accepted`
  // ággal — a régi kliens is be tudja olvasni a `state` mezőt).
  if (stored?.state) {
    const merged = mergeStates(stored.state, state);
    writeState(path, merged, now);
    const unlockedCount = merged.unlockedCards ? Object.keys(merged.unlockedCards).length : 0;
    // Volt-e a kliensben olyan adat ami nem volt a szerveren? Akkor ez tényleg
    // egy merge (két fork találkozott), nem csak felülírás.
    const wasFork = (clientUpdatedAt || 0) < (stored.updatedAt || 0);
        return res.json({
      accepted: true,
      merged: wasFork,
      state: merged,
      updatedAt: now,
    });
  }

  // Első push (új user, üres szerver-állapot)
  writeState(path, state, now);
  const unlockedCount = state.unlockedCards ? Object.keys(state.unlockedCards).length : 0;
    res.json({ accepted: true, merged: false, state, updatedAt: now });
});

// ── Static frontend (production) ────────────────────────────────────────────

if (IS_PROD) {
  const distPath = join(__dirname, '..', 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
  } else {
    console.warn(`WARNING: Production mode, but no dist folder at ${distPath}.`);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`tome sync server listening on :${PORT} (public)`);
  console.log(`Data dir: ${DATA_DIR}`);
  console.log(`Registered users: ${userByNameLower.size}`);
});

