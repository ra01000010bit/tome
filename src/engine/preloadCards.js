// Háttér-prefetcher a ló-képekhez. NEM precache-Workbox: ott a runtime
// cache-First strategy kapja el a /cards/*.png-ket, ide csak az számít,
// hogy idő-alatt küldjünk egy-egy fetchet, aminek a válasza a SW cache-ébe
// kerül — így mire a felhasználó belép a Collection-be, már megvannak a képek
// offline is.
//
// Tervezés:
// - Csak akkor indul, ha a SW regisztrálva van és online vagyunk.
// - 30 mp warmup az app indulásától (engedjük lefutni a quiz-route lazy
//   importot, font-fetcheket, stb.).
// - Sorban egy-egy kép, 2.5 mp szünettel; `requestIdleCallback`-kel ha
//   elérhető, hogy ne küzdjön a renderrel.
// - Tab inactive (`document.hidden`) → szünet, visszatérve folytatja.
// - Offline (`navigator.onLine === false`) → szünet, online eseménynél folyt.
// - Saver-data ON (`navigator.connection.saveData`) vagy 2g-3g → kihagyjuk
//   (a felhasználó adatkímélésben van; majd ha első manuális megnyitásnál
//   jönnek be a képek, az is OK).
// - Egyetlen instance: ha újra hívják, a régi cleanup-ja után indul.

const WARMUP_MS = 30_000;
const STEP_MS = 2_500;

let activeController = null;

function isSaverNetwork() {
  const c = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  if (!c) return false;
  if (c.saveData) return true;
  if (c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return true;
  return false;
}

function whenIdle(cb, timeout = 1500) {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout });
  }
  return setTimeout(cb, 50);
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('aborted'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('aborted')); }, { once: true });
  });
}

async function waitWhilePaused(signal) {
  // Pause loop: tab-hidden vagy offline alatt vár, max 5 mp-enként ellenőrzi.
  while (!signal.aborted && (document.hidden || !navigator.onLine)) {
    await new Promise((r) => setTimeout(r, 5_000));
  }
}

function prefetchOne(url, signal) {
  // Sima Image() — a böngésző `low` priority-vel kezeli a háttérben létrehozott
  // Image-objektumokat. A SW elkapja, és a Cache-First runtime cache eltárolja.
  // Hibatűrő: 404 / network error → nyeli, nem dobjuk fel.
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';   // chromium-only, máshol no-op
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

export function startCardPreloader(urls) {
  // Cleanup egy korábbi futás ha volt (HMR vagy navigation)
  if (activeController) activeController.abort();
  const controller = new AbortController();
  activeController = controller;
  const { signal } = controller;

  // Filter: csak nem-üres URL-eket
  const list = (urls || []).filter((u) => typeof u === 'string' && u.length > 0);
  if (list.length === 0) return () => {};

  // Saver-data alatt teljesen kihagyjuk
  if (isSaverNetwork()) {
    return () => controller.abort();
  }

  (async () => {
    try {
      await delay(WARMUP_MS, signal);
      for (const url of list) {
        if (signal.aborted) return;
        await waitWhilePaused(signal);
        await new Promise((r) => whenIdle(r));
        await prefetchOne(url, signal);
        if (signal.aborted) return;
        await delay(STEP_MS, signal);
      }
    } catch {
      // aborted — ok
    }
  })();

  return () => controller.abort();
}
