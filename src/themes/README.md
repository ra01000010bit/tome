# Témák

A motor (`src/engine/`) téma-független — minden tartalom és vizuális döntés egy
téma-mappában él (`src/themes/<név>/`). Egyszerre egy téma aktív, a `src/theme.js`
választja ki.

- **`_example/`** — semleges, futtatható alaptéma demó tartalommal. Ezt másold.
- Új téma készítése, az adat-sémák és a színrendszer: lásd
  [`docs/THEMING.md`](../../docs/THEMING.md).

Gyors recept:

1. `_example/` → másold új mappára.
2. Töltsd ki: `theme.config.js`, `subjects.js`, `categories.js`, `cards.js`,
   `copy.js`, `topics/*.json`.
3. `src/theme.js` → mutass az új mappára (3 import), és a
   `scripts/validate-questions.mjs` `TOPICS_DIR`-jét is állítsd át.
