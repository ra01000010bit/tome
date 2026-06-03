// Téma fő-aggregátor. A motor csak ezt a fájlt importálja (a src/theme.js-en át).
// Új téma: másold az egész mappát, töltsd ki a fájlokat, és állítsd át a theme.js-t.

import { SUBJECTS, findSubject, splitTetel } from './subjects.js';
import { CARDS, findCard, cardsByCategory } from './cards.js';
import { CATEGORIES, findCategory } from './categories.js';
import { config } from './theme.config.js';
import { COPY } from './copy.js';

// Minden topic-JSON automatikus betöltése (eager) — új tétel = csak egy új fájl.
const topicModules = import.meta.glob('./topics/*.json', { eager: true });
const TOPICS = Object.entries(topicModules)
  .sort(([a], [b]) => a.localeCompare(b))   // stabil sorrend fájlnév szerint
  .map(([, mod]) => mod.default ?? mod);

const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export function findTopic(id) {
  return TOPIC_BY_ID[id];
}

export function topicsForSubject(subjectId) {
  return TOPICS.filter((t) => t.subjectId === subjectId);
}

export function allTopics() {
  return TOPICS;
}

export function allQuestions() {
  return TOPICS.flatMap((t) => t.questions.map((q) => ({ ...q, topicId: t.id })));
}

export {
  SUBJECTS, findSubject, splitTetel,
  CARDS, findCard, cardsByCategory,
  CATEGORIES, findCategory,
  config, COPY,
};
