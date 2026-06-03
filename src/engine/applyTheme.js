// Téma-változók injektálása document.documentElement-re. Minden téma-csere
// megmondja a Tailwindnak hogy mik a `rgb(var(--c-primary-500))` értékei.
// A first-paint default-okat az index.css :root tartja, ez csak felülírja.

import { themeConfig } from '../theme.js';

// ── Doré sötét mód ──────────────────────────────────────────────────────────
// Gustave Doré-metszet hangulat: meleg szénfekete felületek, csont/pergamen
// szöveg, halkított arany. Csak a neutrális csoportokat (base=felület,
// ink=szöveg) invertáljuk + az aranyat (accent) emeljük, hogy sötéten is
// olvasható legyen. A kromatikus accentek (secondary/warm/leaf) maradnak.
// Mind a 7 csoportot felülírjuk. A neutrális csoportoknál (base=felület,
// ink=szöveg) és a kromatikusaknál a világos skálát "megfordítjuk"
// (50≈legvilágosabb→legsötétebb dark felület; 700/900≈sötét→világos szöveg),
// így a világosra tervezett bg-*-100 kitöltések sötétek, a text-*-700-ek
// világosak lesznek. Doré-hangulat: arany/sepia kiemelve, a kromatikus
// accentek halkítva, de jelentés-megtartóan (helyes/hiba zöld/piros marad).
const DARK_PALETTE = {
  base: {
    50:  '38 38 42',   // kártya-felület (semleges hűvös szénfekete, nem barna)
    100: '29 29 33',
    200: '50 50 56',
    300: '70 70 78',
    400: '98 98 108',
    500: '126 126 138',
  },
  ink: {
    400: '156 148 134',
    500: '190 182 166',
    600: '216 208 192',
    700: '234 227 213',  // törzsszöveg — csont
    800: '246 240 227',  // címek — világosabb
    900: '252 249 240',
  },
  accent: {
    200: '92 80 48',
    300: '150 124 70',
    400: '196 166 100',
    500: '212 184 112',  // arany — kiemelve a semleges sötéten
    600: '220 192 122',
    700: '232 206 144',
  },
  primary: {   // levendula (lila) — kitöltések sötétek, szöveg/accent világos
    50:  '45 32 60',
    100: '60 42 82',
    200: '82 56 112',
    300: '112 76 156',
    400: '150 104 214',
    500: '176 122 240',
    600: '194 150 248',
    700: '210 174 250',
    800: '224 198 252',
    900: '236 220 254',
  },
  secondary: { // kek (azúr) — text-secondary-700 világos azúr legyen sötéten
    50:  '12 32 48',
    100: '16 44 66',
    200: '24 70 100',
    300: '40 110 150',
    400: '70 160 215',
    500: '110 190 240',
    600: '150 210 248',
    700: '185 228 252',
    800: '205 238 253',
    900: '225 245 255',
  },
  warm: {      // korall
    200: '90 50 40',
    300: '120 66 54',
    400: '168 96 80',
    500: '205 130 110',
    600: '232 168 150',
  },
  leaf: {      // zold
    400: '110 150 116',
    500: '138 174 142',
    600: '150 186 152',
    700: '168 202 170',
  },
};

export function applyTheme(config = themeConfig) {
  const root = document.documentElement;

  // Paletta — minden csoport, minden árnyalat
  for (const [group, shades] of Object.entries(config.palette || {})) {
    for (const [shade, rgb] of Object.entries(shades)) {
      root.style.setProperty(`--c-${group}-${shade}`, rgb);
    }
  }

  // Font-családok
  if (config.fonts) {
    if (config.fonts.display) root.style.setProperty('--font-display', config.fonts.display);
    if (config.fonts.body)    root.style.setProperty('--font-body',    config.fonts.body);
    if (config.fonts.script)  root.style.setProperty('--font-script',  config.fonts.script);
  }

  // Title (document.title)
  if (config.brand?.full) document.title = config.brand.full;
}

// Aktuális óra Budapesten (0–23), TZ-tudatosan.
function budapestHour() {
  try {
    return parseInt(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Budapest', hour: '2-digit', hour12: false,
    }).format(new Date()), 10);
  } catch {
    return new Date().getHours();
  }
}

// A beállított mód feloldása konkrét 'light'/'dark'-ra. 'auto' (alapértelmezett):
// Budapest 19:00–06:59 között sötét (Doré), 07:00–18:59 között világos.
export function resolveTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  const h = budapestHour();
  return (h >= 19 || h < 7) ? 'dark' : 'light';
}

// Szín-mód váltás: sötétben a DARK_PALETTE-et írja az inline változókra (ezek
// felülírnak minden CSS-osztályt), és felteszi a `dark` class-t a <html>-re
// (a CSS-only részekhez, pl. body::before). Világosban visszaállítja az alap
// palettát. A `mode` lehet 'auto' | 'light' | 'dark'.
export function applyColorMode(mode, config = themeConfig) {
  const root = document.documentElement;
  const dark = resolveTheme(mode) === 'dark';
  root.classList.toggle('dark', dark);

  if (dark) {
    for (const [group, shades] of Object.entries(DARK_PALETTE)) {
      for (const [shade, rgb] of Object.entries(shades)) {
        root.style.setProperty(`--c-${group}-${shade}`, rgb);
      }
    }
  } else {
    // Vissza a világos palettára (a DARK_PALETTE-ben felülírt csoportok)
    for (const group of Object.keys(DARK_PALETTE)) {
      const shades = config.palette?.[group] || {};
      for (const [shade, rgb] of Object.entries(shades)) {
        root.style.setProperty(`--c-${group}-${shade}`, rgb);
      }
    }
  }
}
