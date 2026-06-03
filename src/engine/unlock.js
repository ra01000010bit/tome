// A lecke-teljesítés után gacha-pullt csinál.
// A pull logika a gacha.js-ben van — ez csak a thin wrapper, hogy ha a jövőben
// másképp akarjuk feloldani, csak ezt cseréljük.

import { performPull } from './gacha.js';

export function evaluateUnlock(topic, score /*, completionCount — már nem használt */) {
  return performPull(topic.id, score);
}
