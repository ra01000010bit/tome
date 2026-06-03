# Tome

**Tome** egy újrahasznosítható tanulójáték-keret: bármilyen tananyagból csinálhatsz
vele kártyagyűjtős, ütemezett-ismétléses (spaced repetition) tanulóappot. A motor
téma-független — a tartalmat és a megjelenést egyetlen téma-mappa adja, így ugyanabból
a kódból „varázsolható" bármilyen témájú program.

> Ez a keret egy privát tanulójáték-projektből lett kiemelve és általánosítva.
> A `_example` téma egy semleges, futtatható alaptéma (demó tartalommal).

## Mit tud

- **4 kérdéstípus:** fogalomkártya (flashcard, önértékeléssel), feleletválasztós,
  igaz/hamis, kitöltős (cloze, ékezet-toleráns).
- **FSRS-light ütemezés** — a legrégebben esedékes kérdést hozza elő (nem random).
- **Gyűjthető kártyák** — 80%+ teljesítés véletlen kártyát old fel (gacha-szerű),
  szintekkel; saját „Gyűjtemény"/album nézettel.
- **Multi-user felhő-sync** — Express szerver, per-user JSON state, név-alapú
  regisztráció + eszközök közti folytatás (vektoróra-alapú merge).
- **PWA** — offline-tűrő, telepíthető; világos/sötét (napszak-alapú) téma.
- **Kérdés-pipeline** (opcionális) — forrás-szövegből Claude-dal kérdéscsomag.

## Tech stack

React 18 + Vite 6 + Tailwind + Framer Motion + vite-plugin-pwa · Node 20 + Express
(sync szerver) · Python + `anthropic` (opcionális kérdésgenerátor).

## Gyorsindítás

```bash
npm install
npm run dev        # frontend a http://localhost:3001 -en (a _example témával)
npm run build      # production build (előbb validálja a kérdés-id-ket)
npm test           # FSRS unit tesztek
```

A szinkron-szerver külön fut (csak ha többeszközös mentés kell):

```bash
cd server && npm install && node index.js   # :5050
```

Dev-ben a frontend a saját origin-ján hívja a `/sync`-et; LAN-ról a `VITE_SYNC_URL`-lel
állítható (lásd `.env.example`).

## Saját témájú program 3 lépésben

1. **Másold** az `src/themes/_example` mappát egy új névre (pl. `src/themes/biologia`).
2. **Töltsd ki** a fájlokat: `theme.config.js` (paletta + brand + splash),
   `subjects.js`, `categories.js`, `cards.js` (gyűjthető jutalmak), `copy.js`
   (UI-szövegek), és tegyél legalább egy `topics/*.json` kérdéscsomagot.
3. **Állítsd át** a `src/theme.js` három importját az új mappára.

Részletek: [`docs/THEMING.md`](docs/THEMING.md). Kérdésgenerálás: [`scripts/README.md`](scripts/README.md).

## Architektúra

```
src/
  engine/      # téma-független motor (FSRS, gacha, store, sync, unlock) — sosem változik témánál
  components/  # UI-keret (kérdés-komponensek, splash, ornamentek)
  screens/     # képernyők (Home, Quiz, Collection, Settings, …)
  themes/
    _example/  # az aktív téma (másold a sajátodhoz)
  theme.js     # az EGYETLEN kapcsolópont: melyik téma aktív
server/        # Express sync-szerver (per-user JSON state)
scripts/       # kérdés-pipeline (generate + validate)
```

A motor a Tailwind-osztályokhoz a `--c-*` CSS-változókat használja; a téma
`theme.config.palette`-je futáskor (`applyTheme`) felülírja ezeket, így a
megjelenés témánként cserélhető a komponensek átírása nélkül.

## Deploy

A `Dockerfile` + `fly.toml` egy Fly.io deployt ír le (frontend build + sync-szerver
egy konténerben). Saját deployhoz írd át a `fly.toml` `app` nevét és állítsd be a
`TOME_ORIGIN` secretet (lásd `.env.example`).

## Licenc

MIT — lásd [`LICENSE`](LICENSE).
