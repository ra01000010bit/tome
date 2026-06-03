// Shared localStorage keys. Egyetlen forrás az igazságról — a store.js és a
// sync.js is innen importálja. Verziózott (v1) hogy egy jövőbeli format-bump
// régi adatot ne ütközzön az új sémával.

export const STATE_KEY = 'tome:state:v1';

// A szerverrel utoljára egyeztetett updatedAt timestamp. Perzisztálva, mert
// reload után tudni kell, melyik verziót láttuk legutóbb a szerveren —
// különben a hydrate mindig "frissebb"-nek hiszi a szerver-állapotot, és
// felülírja a még push-olatlan helyi változtatásokat.
export const SYNC_META_KEY = 'tome:sync:v1';

// A szervertől kapott auth token (POST /register után). Ez az igazi user-azonosító;
// a név csak human-readable. Per device, localStorage-ben.
export const AUTH_KEY = 'tome:auth:v1';

export function readSyncMeta() {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) return { lastServerUpdate: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastServerUpdate: typeof parsed?.lastServerUpdate === 'number' ? parsed.lastServerUpdate : 0,
    };
  } catch {
    return { lastServerUpdate: 0 };
  }
}

export function writeSyncMeta(meta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    // localStorage tele vagy disabled — ignore
  }
}

export function readAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null;
    return {
      token: parsed.token,
      userId: typeof parsed.userId === 'string' ? parsed.userId : null,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : null,
    };
  } catch {
    return null;
  }
}

export function writeAuth(auth) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SYNC_META_KEY);
  } catch {}
}

export function readPersistedUserName() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.userName === 'string' && parsed.userName.length >= 2) {
      return parsed.userName;
    }
    return null;
  } catch {
    return null;
  }
}
