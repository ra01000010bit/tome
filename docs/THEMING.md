# Téma-készítés (Theming)

A motor (`src/engine/`) téma-független. Minden tartalom és vizuális döntés egy
téma-mappában él (`src/themes/<név>/`). Egyszerre egy téma aktív, a `src/theme.js`
választja ki.

## Egy téma fájljai

Másold az `src/themes/_example/`-t, és töltsd ki:

| Fájl | Mi van benne |
|---|---|
| `theme.config.js` | `brand` (nevek), `fonts`, `palette` (RGB triplet shade-enként), `splash`, `terminology`. |
| `subjects.js` | A tananyag fő-választói (`SUBJECTS`) + `findSubject` + `splitTetel`. |
| `categories.js` | A „Gyűjtemény"/album fejezetei (`CATEGORIES`) + `findCategory`. |
| `cards.js` | Gyűjthető kártyák (`CARDS`) + `findCard` + `cardsByCategory`. |
| `copy.js` | Minden UI-szöveg egy helyen (`COPY`). |
| `index.js` | Aggregátor — a motor csak ezt importálja. Auto-betölti a `topics/*.json`-t. |
| `topics/*.json` | Kérdéscsomagok (kézzel vagy a pipeline-nal). |

## Adat-sémák

### Subject (subjects.js)
```js
{ id, name, letter, range, iconName, accent, description, topicIds: ['demo_01'] }
```
A Home a `letter`-t mutatja egy medálon; a `topicIds` köti be a kérdéscsomagokat.

### Category (categories.js)
```js
{ id, name, subtitle, accent /* hex */, description }
```

### Card (cards.js) — a gyűjthető jutalmak
```js
{ id, category /* egy categories id */, name,
  subtitle?, source?, lore?,
  levels: [ { level: 1, image: '/cards/akarmi.png' | null } ] }
```
A `levels` a duplikátum-upgrade (egy kártya többször feloldva magasabb szintet kap).
`image: null` → placeholder-sziluett (nem kell kép a kezdéshez).

### Topic (topics/*.json)
```json
{
  "id": "demo_01",
  "subjectId": "demo",
  "name": "D1. Bemutató tétel",
  "source": "...",
  "unlockCardId": "",
  "questions": [ ... ]
}
```

### A 4 kérdéstípus
```jsonc
{ "id": "x_001", "type": "flashcard", "front": "...", "back": "...", "explanation": "?" }
{ "id": "x_002", "type": "multiple_choice", "text": "...", "options": ["A","B","C","D"], "correct": 1, "explanation": "?" }
{ "id": "x_003", "type": "true_false", "statement": "...", "correct": true, "explanation": "?" }
{ "id": "x_004", "type": "cloze", "text": "A {{c1}} a {{c2}}.", "answers": ["x","y"], "explanation": "?" }
```
A kérdés-`id` legyen `<topic_id>_NNN` (egyedi, stabil — az FSRS-előzmény ehhez kötődik).
A cloze-nál a `{{cN}}` helyőrzők száma = az `answers` hossza.

## Színek és témaváltás

A Tailwind-osztályok (`bg-primary-500`, `text-ink-700`, …) a `--c-<csoport>-<shade>`
CSS-változókból olvasnak. A `theme.config.palette` adja az értékeket, amit az
`applyTheme()` (`src/engine/applyTheme.js`) futáskor a `:root`-ra ír. Így a téma
cserekor **nem kell** a komponenseket vagy a Tailwind-configot átírni — csak a
paletta-értékeket. A csoportok: `primary, secondary, base, ink, accent, warm, leaf`.
A sötét mód („Doré") inverzét a motor számolja; elég a világos palettát megadni.

## Téma aktiválása

`src/theme.js` — cseréld a három import elérési útját a saját téma-mappádra:
```js
export * from './themes/<téma>/index.js';
export { default as themeConfig } from './themes/<téma>/theme.config.js';
export { default as COPY }        from './themes/<téma>/copy.js';
```
A `validate-questions.mjs` (build-gate) `TOPICS_DIR` konstansát is állítsd át az
aktív téma `topics/` mappájára.

## Saját splash (opcionális)

A default `components/SplashGate.jsx` a `theme.config.splash` mezőiből épül
(monogram, gradiens, cím-színek). Ha egyedi nyitót akarsz, írj saját `Splash.jsx`-et
a téma-mappádba és rendereld az `App.jsx`-ben.
```
