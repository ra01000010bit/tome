import { useSyncExternalStore } from 'react';
import { freshState, applyRating } from './fsrs.js';
import { pushToServer, pullFromServer, isSyncEnabled, onConflict, pushBeacon } from './sync.js';
import { STATE_KEY } from './storage.js';

const initial = {
  userName: null,
  deviceId: null,
  questionStates: {},
  topicProgress: {},
  unlockedCards: {},
  cardOrder: [],
  starterClaimed: false,
  vectorClock: {},
  settings: {
    confidenceMode: false,
    disabledTypes: [],
    theme: 'auto',  // 'auto' (napszak: Budapest 19–7 sötét) | 'light' | 'dark'
  },
};

// FIGYELEM: a `persistTimer`-nek ELŐBB kell létezni, mint az alábbi
// `state.deviceId` init-blokk — ez ugyanis hívja a `persist()`-et, ami
// olvassa a `persistTimer`-t. A `function persist()` deklaráció hoistolódik,
// de a `let persistTimer` nem (TDZ) → új userre crash-elt fehér képernyővel.
let persistTimer = null;

let state = load();
// Biztosítjuk, hogy mindig legyen deviceId
if (!state.deviceId) {
  state.deviceId = Math.random().toString(36).substring(2, 10);
  persist();
}

const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return structuredClone(initial);
    const parsed = JSON.parse(raw);
    return mergeWithInitial(parsed);
  } catch {
    return structuredClone(initial);
  }
}

function mergeWithInitial(parsed) {
  const base = structuredClone(initial);
  const merged = { ...base, ...parsed };
  
  // Védjük le a kritikus objektumokat, ha a localStorage-ből null/undefined jönne
  merged.unlockedCards = merged.unlockedCards || {};
  merged.questionStates  = merged.questionStates || {};
  merged.topicProgress   = merged.topicProgress || {};
  merged.cardOrder     = merged.cardOrder || [];
  merged.settings        = { ...base.settings, ...(parsed?.settings || {}) };
  
  return merged;
}

// Debounced persist: gyors burst (pl. quiz-válaszok) alatt csak az utolsó szerializál.
// flushPersist() szinkron-mentést kényszerít (page-hide / beforeunload).
// (`persistTimer` deklarációja feljebb van — a `state.deviceId` init-blokk miatt.)
function persist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be full or disabled; ignore
    }
  }, 120);
}

export function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

// HMR-guard: dev-ben a modul többször importálódhat, ne adjunk hozzá duplikált
// listener-eket. Production-ben egyetlen import van — ez no-op.
if (typeof window !== 'undefined' && !window.__tomePersistBound) {
  window.__tomePersistBound = true;

  function onLeaving() {
    flushPersist();
    pushBeacon(state);  // sendBeacon: garantáltan elküldi a tab bezárása alatt is
  }

  // visibilitychange a legmegbízhatóbb iOS-en — pagehide bf-cache-elt oldalnál
  // nem mindig fut, beforeunload szintén nem garantált.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onLeaving();
  });
  window.addEventListener('pagehide', onLeaving);
  window.addEventListener('beforeunload', flushPersist);
}

function emit() {
  for (const l of listeners) l();
}

function set(updater) {
  const nextState = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  const currentClock = nextState.vectorClock || {};
  const currentTick = currentClock[state.deviceId] || 0;
  state = {
    ...nextState,
    vectorClock: { ...currentClock, [state.deviceId]: currentTick + 1 }
  };
  persist();
  emit();
  pushToServer(() => state);
}

onConflict((remoteState) => {
  state = mergeWithInitial(remoteState);
  persist();
  emit();
});

// Hívd egyszer az app indulásakor — ha van frissebb a szerveren, betölti.
//
// Race-guard: a fetch alatt a user gépelhet a UserGate-ben (vagy más quick
// interakció). Ha közben `set()` futott, a state-referencia megváltozik —
// ilyenkor a helyi állapot nyer (push lökjük fel), nem írjuk felül a server
// válaszával. Különben elvesznének a fetch alatt rögzített módosítások.
//
// `overwrite: true` — a UserGate "claim másik eszközről" flow-jánál a szerver
// állapota a forrás akkor is, ha az updatedAt a watermark alatt van (új
// telepítésen lastServerUpdate=0, a szerver bármilyen valid állapota frissebb).
// Ekkor a race-guard sem kell, mert a UserGate alatt a felhasználó még nem
// lépett be a játékba.
export async function hydrateFromServer({ overwrite = false } = {}) {
  if (!isSyncEnabled()) return;
  const stateBefore = state;
  const remote = await pullFromServer();
  if (!overwrite && state !== stateBefore) {
    pushToServer(() => state, true);
    return;
  }
  if (remote?.ok && remote.state) {
    if (overwrite || remote.fresh) {
      state = mergeWithInitial(remote.state);
      persist();
      emit();
    }
  }
}

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => selector(state),
    () => selector(state),
  );
}

export function getState() {
  return state;
}

// ── Question state ───────────────────────────────────────────────────────────

export function getQuestionState(qid) {
  return state.questionStates[qid] || freshState();
}

export function recordAnswer(qid, rating) {
  const prev = getQuestionState(qid);
  const next = applyRating(prev, rating);
  set((s) => ({
    ...s,
    questionStates: { ...s.questionStates, [qid]: next },
  }));
}

// ── Topic progress ───────────────────────────────────────────────────────────

export function recordTopicCompletion(topicId, score) {
  const prev = state.topicProgress[topicId] || { bestScore: 0, completionCount: 0, lastCompleted: null };
  const next = {
    bestScore: Math.max(prev.bestScore, score),
    completionCount: prev.completionCount + 1,
    lastCompleted: Date.now(),
  };
  set((s) => ({
    ...s,
    topicProgress: { ...s.topicProgress, [topicId]: next },
  }));
  return next;
}

export function getTopicProgress(topicId) {
  return state.topicProgress[topicId] || { bestScore: 0, completionCount: 0, lastCompleted: null };
}

// ── Cards ─────────────────────────────────────────────────────────────────

export function unlockCard(cardId, level, fromTopic) {
  const prev = state.unlockedCards[cardId];
  // Csak akkor frissítsük, ha új unlock vagy magasabb szint
  if (prev && prev.level >= level) return false;
  set((s) => ({
    ...s,
    unlockedCards: {
      ...s.unlockedCards,
      [cardId]: { level, unlockedAt: Date.now(), fromTopic },
    },
  }));
  return true;
}

export function isCardUnlocked(cardId) {
  return Boolean(state.unlockedCards[cardId]);
}

export function setCardOrder(order) {
  set((s) => ({ ...s, cardOrder: order }));
}

// ── Starter ─────────────────────────────────────────────────────────────────

export function markStarterClaimed() {
  set((s) => ({ ...s, starterClaimed: true }));
}

// ── User identity ───────────────────────────────────────────────────────────

export function getUserName() {
  return state.userName;
}

export function setUserName(name) {
  const trimmed = String(name || '').trim().slice(0, 40);
  if (!trimmed) return false;
  set((s) => ({ ...s, userName: trimmed }));
  return true;
}

// ── Settings ────────────────────────────────────────────────────────────────

export function updateSetting(key, value) {
  set((s) => ({ ...s, settings: { ...s.settings, [key]: value } }));
}

export function resetAll() {
  state = structuredClone(initial);
  // Új deviceId, hogy a userName-alapú slug ne ütközzön a reset előtti fájlnévvel.
  state.deviceId = Math.random().toString(36).substring(2, 10);
  flushPersist();
  emit();
  // Kritikus: a szerverre AZONNAL push-oljunk (immediate=true), különben a
  // debounce alatti reload-ban a hydrateFromServer visszatölti a régi adatokat
  // és a törlés hatástalan marad.
  pushToServer(() => state, true);
}

// Visszaállítás backup-fájlból: shape-ellenőrzés, deep-merge az initial-lel,
// szinkron mentés, server push. Hibás backupot el kell utasítani — különben
// a hiányzó/rossz típusú mezők NaN-okkal megakaszthatják az FSRS-t.
const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function validateBackup(parsed) {
  if (!isPlainObject(parsed)) return { ok: false, error: 'Nem JSON-objektum.' };
  if ('questionStates'  in parsed && !isPlainObject(parsed.questionStates))  return { ok: false, error: 'questionStates érvénytelen.' };
  if ('topicProgress'   in parsed && !isPlainObject(parsed.topicProgress))   return { ok: false, error: 'topicProgress érvénytelen.' };
  if ('unlockedCards' in parsed && !isPlainObject(parsed.unlockedCards)) return { ok: false, error: 'unlockedCards érvénytelen.' };
  if ('cardOrder'     in parsed && !Array.isArray(parsed.cardOrder))     return { ok: false, error: 'cardOrder nem lista.' };
  if ('settings'        in parsed && !isPlainObject(parsed.settings))        return { ok: false, error: 'settings érvénytelen.' };
  return { ok: true };
}

export function importState(parsed) {
  const v = validateBackup(parsed);
  if (!v.ok) throw new Error(v.error);
  state = mergeWithInitial(parsed);
  flushPersist();
  emit();
  pushToServer(() => state);
}
