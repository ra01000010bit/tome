// A „Gyűjtemény" / album fejezetei. Mindegyikhez tartozhat 0+ kártya
// (cards.js `category` mező). Új fejezet: vegyél fel egy objektumot ide,
// és a kártyák `category` mezőjével hivatkozz rá.

export const CATEGORIES = [
  {
    id: 'constellations',
    name: 'Csillagképek',
    subtitle: 'Az éjszakai égbolt',
    accent: '#3b4a8a',
    description: 'Klasszikus csillagképek — a demó gyűjtemény első fejezete.',
  },
  {
    id: 'gems',
    name: 'Drágakövek',
    subtitle: 'Ásványi kincsek',
    accent: '#9b7e3a',
    description: 'Színes drágakövek — a demó gyűjtemény második fejezete.',
  },
];

export function findCategory(id) {
  return CATEGORIES.find((c) => c.id === id);
}
