// A téma gyűjthető kártyái (a jutalom-mechanika tárgyai). A motor a `category`
// mezőn át rendeli őket fejezetekhez (categories.js).
//
// Mező-leírás:
//   id        — egyedi azonosító (string, snake_case)
//   category  — egy categories.js-beli ID
//   name      — kártyán látható név
//   subtitle  — másodlagos cím (opcionális; pl. „ki/mi birtokolja")
//   source    — eredet: könyv, hely, mítosz, stb. (opcionális)
//   lore      — 1-3 mondatos ízes leírás (opcionális)
//   levels    — szintek (gacha-duplikátum upgrade): [{ level, image }]
//               image: '/cards/akármi.png' VAGY null (placeholder-sziluett)

export const CARDS = [
  // ── Csillagképek ──────────────────────────────────────────────────────────
  {
    id: 'orion',
    category: 'constellations',
    name: 'Orion',
    subtitle: 'A Vadász',
    source: 'Éjszakai égbolt',
    lore: 'A tél legfényesebb csillagképe, övén a három egymáshoz simuló csillaggal.',
    levels: [
      { level: 1, image: null },
      { level: 2, image: null },
    ],
  },
  {
    id: 'lyra',
    category: 'constellations',
    name: 'Lyra',
    subtitle: 'A Lant',
    source: 'Éjszakai égbolt',
    lore: 'Apró, de ragyogó csillagkép; fő csillaga a Vega, a nyári égbolt egyik vezércsillaga.',
    levels: [{ level: 1, image: null }],
  },
  {
    id: 'draco',
    category: 'constellations',
    name: 'Draco',
    subtitle: 'A Sárkány',
    source: 'Éjszakai égbolt',
    lore: 'Hosszan kanyargó csillagkép, amely a Kis Medve köré tekeredik az északi égbolton.',
    levels: [{ level: 1, image: null }],
  },
  {
    id: 'cassiopeia',
    category: 'constellations',
    name: 'Cassiopeia',
    subtitle: 'A Királyné',
    source: 'Éjszakai égbolt',
    lore: 'Jellegzetes „W" alakja miatt könnyen felismerhető cirkumpoláris csillagkép.',
    levels: [{ level: 1, image: null }],
  },

  // ── Drágakövek ────────────────────────────────────────────────────────────
  {
    id: 'emerald',
    category: 'gems',
    name: 'Smaragd',
    subtitle: 'A zöld berill',
    source: 'Ásványvilág',
    lore: 'Mély zöld drágakő, a berill króm- és vanádium-színezte változata.',
    levels: [{ level: 1, image: null }],
  },
  {
    id: 'ruby',
    category: 'gems',
    name: 'Rubin',
    subtitle: 'A vörös korund',
    source: 'Ásványvilág',
    lore: 'A korund vörös, krómtól színeződő változata — keménységben a gyémánt után következik.',
    levels: [{ level: 1, image: null }],
  },
];

export function findCard(id) {
  return CARDS.find((c) => c.id === id);
}

export function cardsByCategory(catId) {
  return CARDS.filter((c) => c.category === catId);
}
