// Gacha-stílusú lo-pull mechanika.
//
// Szabályok:
//  - 80%+ pontszám alatt nincs pull (későbbi körre marad).
//  - A pool azokat tartalmazza, amelyekből még van feloldatlan szint.
//  - Ha duplikátum (már megvan a ló) → magasabb szintet kap (ha van).
//  - Ha mindent maxoltunk → null (nincs jutalom, de a fejlődés látszik a Karámban).

import { CARDS } from '../theme.js';
import { unlockCard, getState } from './store.js';

function getAvailablePool(unlocked) {
  // Csoportosítás: csak azok az állatok, amelyekből még van feloldatlan szint.
  const pool = [];
  for (const a of CARDS) {
    const u = unlocked[a.id];
    const currentLevel = u?.level || 0;
    if (currentLevel < a.levels.length) {
      pool.push(a);
    }
  }
  return pool;
}

function pickCard(pool) {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pullCard(score) {
  if (score < 80) return null;
  const state = getState();
  const pool = getAvailablePool(state.unlockedCards);

  if (pool.length === 0) return null;

  const card = pickCard(pool);
  const existing = state.unlockedCards[card.id];
  const newLevel = (existing?.level || 0) + 1;

  return { card, level: newLevel, isNew: !existing };
}

// Convenience: pull + commit a store-ba
export function performPull(topicId, score) {
  const result = pullCard(score);
  if (!result) return null;
  unlockCard(result.card.id, result.level, topicId);
  return result;
}

// Üdvözlő pull: Első indításkor sorsol egy random kártyát.
export function performStarterPull() {
  const state = getState();
  const pool = getAvailablePool(state.unlockedCards);
  if (pool.length === 0) return null;

  const card = pickCard(pool);
  unlockCard(card.id, 1, '__starter__');
  return { card, level: 1, isNew: true, isStarter: true };
}
