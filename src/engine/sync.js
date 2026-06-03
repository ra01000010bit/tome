// Cloud sync. A token a localStorage-ban van (tome:auth:v1) — POST /register
// után kerül oda. Ha nincs token, a sync ki van kapcsolva, csak localStorage.

import { readSyncMeta, writeSyncMeta, readAuth, writeAuth, clearAuth } from './storage.js';

// Dev mode-ban opcionálisan be lehet állítani egy abszolút URL-t (LAN IP-vel),
// production-ben üres = ugyanaz az origin (relative path). A frontend és a
// szerver ugyanazon a Fly.io app-on fut, így a `/sync` és `/register` mindkét
// környezetben a saját origin-jén van — abszolút URL csak akkor kell,
// ha a Vite dev server (3001) másik gépről hívja a backendet (5050).
const SYNC_URL = import.meta.env.VITE_SYNC_URL || '';
const DEBOUNCE_MS = 5000;

let lastServerUpdate = readSyncMeta().lastServerUpdate;
let pushTimer = null;
let lastGetState = null;
let conflictResolver = null;

function url(path) {
  return SYNC_URL ? `${SYNC_URL}${path}` : path;
}

function getToken() {
  return readAuth()?.token || null;
}

export function isSyncEnabled() {
  const t = getToken();
  // Az `offline-...` token a UserGate fallbackja, amikor a szerver nem érhető
  // el regisztrációkor. Ilyenkor NINCS valódi szerver-oldal → a sync kikapcsolt
  // (csak localStorage), különben minden pull/push hiába hívná a szervert
  // (ERR_CONNECTION_REFUSED, ~2.3s blokk). Valódi sync = szerver-adott token.
  return Boolean(t) && !t.startsWith('offline-');
}

export function onConflict(fn) {
  conflictResolver = fn;
}

function persistWatermark(updatedAt) {
  if (typeof updatedAt !== 'number' || updatedAt <= 0) return;
  lastServerUpdate = updatedAt;
  writeSyncMeta({ lastServerUpdate });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (lastGetState && isSyncEnabled()) {
      console.log('[sync] Hálózat helyreállt, push…');
      pushToServer(lastGetState, true);
    }
  });
}

// ── Registration / claim ─────────────────────────────────────────────────────

// POST /register — visszaadja vagy a tokent (created/claimed) vagy a
// summary-t (exists). A hívó UI dönt, hogy claim-eli-e.
export async function registerUser(name, claim = false) {
  try {
    const res = await fetch(url('/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, claim }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return { ok: false, status: res.status, error: errBody.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (e) {
    return { ok: false, status: 0, error: e.message || 'network error' };
  }
}

// Mentési segéd: /register után, ha van token, eltesszük. UserGate hívja.
export function saveAuth({ token, userId, displayName }) {
  if (!token) return;
  writeAuth({ token, userId, displayName });
  // Új user / device-váltás esetén a watermark reset, hogy a hydrate
  // a szerver oldali állapotot frissnek lássa.
  writeSyncMeta({ lastServerUpdate: 0 });
  lastServerUpdate = 0;
}

export function logoutAuth() {
  clearAuth();
  lastServerUpdate = 0;
}

// ── Sync ─────────────────────────────────────────────────────────────────────

function authHeader() {
  const t = getToken();
  return t ? { 'x-tome-token': t } : {};
}

export async function pullFromServer() {
  if (!isSyncEnabled()) return { ok: false, reason: 'disabled' };
  try {
    const res = await fetch(url('/sync'), { headers: authHeader() });
    if (res.status === 401) {
      console.warn('[sync] 401 — kijelentkezett a szerveren, töröljük a tokent');
      logoutAuth();
      return { ok: false, reason: 'unauthorized' };
    }
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    const newer = data?.state && data.updatedAt > lastServerUpdate;
    if (newer) persistWatermark(data.updatedAt);
    // A `state` mezőt mindig visszaadjuk — a hívó dönt, hogy a `fresh` flag
    // nélkül is felhasználja-e (pl. claim után a watermark=0, tehát a
    // szerver-állapot mindig használandó akkor is, ha a `fresh` false volna
    // valamilyen óra-eltérés miatt).
    return { ok: true, fresh: newer, state: data?.state || null, updatedAt: data?.updatedAt || 0 };
  } catch (e) {
    console.warn('[sync] pull failed:', e.message);
    return { ok: false, reason: e.message };
  }
}

export function pushToServer(getState, immediate = false) {
  if (!isSyncEnabled()) return;
  lastGetState = getState;
  if (pushTimer) clearTimeout(pushTimer);

  const execPush = async () => {
    try {
      const state = typeof getState === 'function' ? getState() : getState;
      const res = await fetch(url('/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ state, clientUpdatedAt: lastServerUpdate }),
      });
      if (res.status === 401) { logoutAuth(); return; }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      // Régi protokoll (last-write-wins, accepted=false): a szerver elutasít,
      // visszaadja a saját state-jét, a kliens átveszi.
      // Új protokoll: a szerver mindig accept-ál és mindig merge-el.
      //   - merged=true: tényleg történt fork-feloldás, a klienst frissítjük
      //     a merged eredménnyel (különben elveszítenénk az újonnan
      //     visszanyert mezőket, pl. a másik eszköz haladását).
      //   - merged=false: egyszerű felülírás, csak a watermark kell.
      if (data.accepted === false && data.state) {
        if (data.updatedAt) persistWatermark(data.updatedAt);
        conflictResolver?.(data.state);
      } else if (data.accepted === true && data.merged && data.state) {
        if (data.updatedAt) persistWatermark(data.updatedAt);
        conflictResolver?.(data.state);
      } else if (data.updatedAt) {
        persistWatermark(data.updatedAt);
      }
    } catch (e) {
      console.warn('[sync] push failed:', e.message);
    }
  };

  if (immediate) execPush();
  else pushTimer = setTimeout(execPush, DEBOUNCE_MS);
}

// sendBeacon a tab-bezárás alatt is elküldi. Tokent query-paramban kapja
// (a sendBeacon nem támogat header-t Blob payload-dal).
export function pushBeacon(state) {
  if (!isSyncEnabled()) return false;
  if (pushTimer) clearTimeout(pushTimer);
  try {
    const t = getToken();
    if (!t) return false;
    const params = new URLSearchParams({ token: t });
    const target = `${url('/sync')}?${params.toString()}`;
    const blob = new Blob(
      [JSON.stringify({ state, clientUpdatedAt: lastServerUpdate })],
      { type: 'text/plain' },
    );
    return navigator.sendBeacon?.(target, blob) ?? false;
  } catch (e) {
    console.warn('[sync] beacon failed:', e.message);
    return false;
  }
}
