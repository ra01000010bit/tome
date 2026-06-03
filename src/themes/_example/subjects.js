// A tananyag „tantárgyai" (a tanulás fő választói). Mindegyikhez topicIds →
// topics/*.json fájlok tartoznak. A Home a `letter` betűt jeleníti meg a medálon.
//
// Mezők: id, name, letter, range, iconName (lucide-react név), accent
// (Tailwind from-* to-* gradiens), description, topicIds.

export const SUBJECTS = [
  {
    id: 'demo',
    name: 'Demó',
    letter: 'D',
    range: '1 tétel',
    iconName: 'BookOpen',
    accent: 'from-primary-200 to-primary-100',
    description: 'Bemutató tétel mind a négy kérdéstípussal.',
    topicIds: ['demo_01'],
  },
  {
    id: 'sandbox',
    name: 'Homokozó',
    letter: 'H',
    range: 'üres',
    iconName: 'Layers',
    accent: 'from-secondary-200 to-secondary-100',
    description: 'Ide kerülhet a saját tananyagod — egyelőre üres.',
    topicIds: [],
  },
];

export function findSubject(id) {
  return SUBJECTS.find((s) => s.id === id);
}

// Opcionális kód-prefix bontás: „D1. Cím" → { code: 'D1', title: 'Cím' }.
// Ha nincs felismerhető prefix, az egész nevet adja vissza title-ként.
export function splitTetel(name) {
  const m = String(name || '').match(/^\s*([\p{Lu}\d][\p{L}\d/]*)\.\s+(.*)$/su);
  if (m) return { code: m[1].replace(/\s+/g, ''), title: m[2].trim() };
  return { code: null, title: String(name || '') };
}
