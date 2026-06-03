#!/usr/bin/env node
// Kérdés-bank validátor.
//
// MIÉRT: a `questionStates`-ben a kérdés ID a kulcs (`endokrin_001`). Ha egy
// kérdést átszámozunk vagy duplikálunk, a felhasználó FSRS-története
// elromlik (pl. egy másik kérdés review-előzményét örökli). Ez a script
// build-időben futtatható ellenőrzés, hogy:
//   1) minden kérdésnek van string ID-ja
//   2) az ID-k globálisan egyediek (ne csak fájlon belül)
//   3) az ID stabil formátumú: `<topic-slug>_<3-digit>` (ajánlás, nem kötelező)
//   4) a fájlok parseolhatók
//
// Használat:
//   node scripts/validate-questions.mjs           # exit 0 ha minden OK
//   node scripts/validate-questions.mjs --strict  # warningokat is hibának veszi

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Az aktív téma topic-mappája. Téma-cserekor írd át a mappanevet.
const TOPICS_DIR = join(__dirname, '..', 'src', 'themes', '_example', 'topics');
const STRICT = process.argv.includes('--strict');

const errors = [];
const warnings = [];
const seenIds = new Map();  // qid -> file

let files;
try {
  files = readdirSync(TOPICS_DIR).filter((f) => f.endsWith('.json'));
} catch (e) {
  console.error(`FATAL: cannot read ${TOPICS_DIR}:`, e.message);
  process.exit(2);
}

for (const file of files) {
  const path = join(TOPICS_DIR, file);
  let topic;
  try {
    topic = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(topic.questions)) {
    errors.push(`${file}: missing or non-array "questions"`);
    continue;
  }
  if (typeof topic.id !== 'string' || !topic.id) {
    errors.push(`${file}: topic.id missing`);
  }
  topic.questions.forEach((q, idx) => {
    if (!q || typeof q !== 'object') {
      errors.push(`${file}#${idx}: question is not an object`);
      return;
    }
    if (typeof q.id !== 'string' || !q.id) {
      errors.push(`${file}#${idx}: question.id missing or not a string`);
      return;
    }
    if (seenIds.has(q.id)) {
      errors.push(`${file}: duplicate question id "${q.id}" — also defined in ${seenIds.get(q.id)}`);
    } else {
      seenIds.set(q.id, file);
    }
    // Ajánlott formátum: `<slug>_<digits>` (pl. endokrin_001) — stabil, sorrendfüggetlen,
    // emberolvasható. Figyelmeztetés ha eltér.
    if (!/^[a-z][a-z0-9_-]*_\d{3,}$/.test(q.id)) {
      warnings.push(`${file}: id "${q.id}" doesn't match recommended format <slug>_<digits>`);
    }

    // Cloze-specifikus: {{c1}}…{{cN}} számának egyeznie kell az answers[] hosszával.
    if (q.type === 'cloze') {
      if (!q.text || typeof q.text !== 'string') {
        errors.push(`${file}[${q.id}]: cloze question missing "text"`);
      } else if (!Array.isArray(q.answers) || q.answers.length === 0) {
        errors.push(`${file}[${q.id}]: cloze question missing "answers" array`);
      } else {
        const blankNums = [...q.text.matchAll(/\{\{c(\d+)\}\}/g)].map((m) => parseInt(m[1], 10));
        const uniqueCount = new Set(blankNums).size;
        if (uniqueCount !== q.answers.length) {
          errors.push(`${file}[${q.id}]: cloze has ${uniqueCount} blank(s) {{c1}}…{{cN}} but "answers" has ${q.answers.length} item(s)`);
        }
      }
    }
  });
}

if (errors.length) {
  console.error('VALIDATION ERRORS:');
  for (const e of errors) console.error('  ✗', e);
}
if (warnings.length) {
  console.warn('WARNINGS:');
  for (const w of warnings) console.warn('  !', w);
}
if (!errors.length && !warnings.length) {
  console.log(`OK: ${seenIds.size} questions across ${files.length} topics, all ids unique.`);
}

if (errors.length || (STRICT && warnings.length)) process.exit(1);
process.exit(0);
