// FSRS-light: egyszerűsített spaced-repetition scheduler.
// Minden kérdéshez tárolunk egy state-et, és a válasz minősítése alapján
// frissítjük. A queue mindig a legrégebben esedékes kérdést dobja először.

const DAY_MS = 24 * 60 * 60 * 1000;

export const RATING = {
  AGAIN:    'again',     // nem tudtam
  HARD:     'hard',      // nagyjából, bizonytalanul
  GOOD:     'good',      // tudtam
};

export function freshState() {
  return {
    stability: 1.0,
    difficulty: 5.0,
    lastReviewed: null,
    reviewCount: 0,
    correctCount: 0,
    state: 'new',
  };
}

export function applyRating(prev, rating, now = Date.now()) {
  // Guard: a `correctCount` mezőt később adtuk hozzá az FSRS state-hez.
  // Régi mentésekben nincs benne — ott `undefined + 1 = NaN`-t kapnánk, és
  // mivel a NaN ragályos, a kérdés örökre kiesne a Hibanapló-szűrésből
  // (NaN < 0.6 mindig false). Ugyanígy reviewCount/stability/difficulty
  // is fallback-szel — egy hibás backup-import se borítsa NaN-okkal.
  const s = {
    ...prev,
    stability:    Number.isFinite(prev.stability)    ? prev.stability    : 1.0,
    difficulty:   Number.isFinite(prev.difficulty)   ? prev.difficulty   : 5.0,
    reviewCount:  Number.isFinite(prev.reviewCount)  ? prev.reviewCount  : 0,
    correctCount: Number.isFinite(prev.correctCount) ? prev.correctCount : 0,
  };
  s.reviewCount += 1;
  s.lastReviewed = now;

  if (rating === RATING.GOOD) {
    s.stability = s.stability * 2.5;
    s.difficulty = clamp(s.difficulty - 0.3, 1, 10);
    s.correctCount += 1;
    s.state = 'review';
  } else if (rating === RATING.HARD) {
    s.stability = s.stability * 1.3;
    s.correctCount += 1;
    s.state = 'review';
  } else if (rating === RATING.AGAIN) {
    // README specifikáció: max(0.5, *0.3). Ha 1-en hagyjuk, sosem jön 1 nap alá.
    s.stability = Math.max(0.5, s.stability * 0.3);
    s.difficulty = clamp(s.difficulty + 0.5, 1, 10);
    s.state = 'learning';
  }
  return s;
}

export function dueAt(state) {
  if (!state.lastReviewed) return 0;
  return state.lastReviewed + state.stability * DAY_MS;
}

export function isDue(state, now = Date.now()) {
  return dueAt(state) <= now;
}

// Sorba rendez kérdéseket: új kérdések → esedékesség szerint.
export function buildQueue(questions, statesByQid, now = Date.now()) {
  const annotated = questions.map((q) => {
    const state = statesByQid[q.id] || freshState();
    return { question: q, state, due: dueAt(state) };
  });

  // Új és esedékes kérdéseket vegyítve dobjuk
  const dueOrNew = annotated.filter(
    ({ state, due }) => state.state === 'new' || due <= now,
  );
  // Sorrend: tanulás (újra-jönnek) → új → már esedékes review
  dueOrNew.sort((a, b) => {
    const order = { learning: 0, new: 1, review: 2 };
    const oa = order[a.state.state] ?? 3;
    const ob = order[b.state.state] ?? 3;
    if (oa !== ob) return oa - ob;
    return a.due - b.due;
  });
  return dueOrNew.map(({ question }) => question);
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}
