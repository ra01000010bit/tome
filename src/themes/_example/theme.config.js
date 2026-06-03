// Példa / alapértelmezett téma. Másold át a mappát egy új névre, írd át az
// értékeket, majd a src/theme.js-ben mutass az új mappára.
//
// Ez a config az, amit a Tome dobozból kibontva mutat: semleges „pergamen +
// arany" megjelenés, demó tartalommal (csillagképek + drágakövek kártyák).

export const config = {
  id: 'example',

  brand: {
    short: 'TOME',
    line1: 'TOME',
    line2: 'STARTER',
    full:  'Tome — Starter téma',
    tagline: 'Saját tananyag, kártyagyűjtéssel',
  },

  fonts: {
    display: "'Cinzel', Georgia, 'Times New Roman', serif",
    body:    "'Cormorant Garamond', Georgia, 'Times New Roman', serif",
    script:  "'Cormorant Garamond', Georgia, serif",
  },

  // RGB triplet, space-separated. A Tailwind a `rgb(var(--c-primary-500))`-ön át
  // olvassa. Minden shade-szám kell, amit a tailwind.config.js deklarál.
  palette: {
    primary: {
      50: '250 245 255', 100: '243 232 255', 200: '233 213 255', 300: '216 180 254',
      400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 700: '126 34 206',
      800: '107 33 168', 900: '88 28 135',
    },
    secondary: {
      50: '240 249 255', 100: '224 242 254', 200: '186 230 253', 300: '125 211 252',
      400: '56 189 248', 500: '14 165 233', 600: '2 132 199', 700: '3 105 161',
      800: '7 89 133', 900: '12 74 110',
    },
    base: {
      50: '253 252 247', 100: '248 243 230', 200: '240 230 200',
      300: '230 212 163', 400: '217 189 117', 500: '200 165 87',
    },
    ink: {
      400: '115 115 115', 500: '82 82 82', 600: '38 38 38',
      700: '23 23 23', 800: '10 10 10', 900: '0 0 0',
    },
    accent: {
      200: '230 212 163', 300: '217 191 124', 400: '201 169 97',
      500: '184 148 90', 600: '155 126 58', 700: '122 94 34',
    },
    warm: {
      200: '240 212 196', 300: '232 184 168', 400: '217 152 135',
      500: '196 120 102', 600: '168 91 72',
    },
    leaf: {
      400: '155 184 158', 500: '122 158 126', 600: '90 128 96', 700: '68 98 72',
    },
  },

  splash: {
    monogram:   'T',
    button:     'Koppints a belépéshez',
    titleColor: '#3a2a10',
    titleGlow:  'rgba(255,255,255,0.7)',
    titleAura:  'rgba(155,126,58,0.25)',
    bgGradient: 'radial-gradient(ellipse at 50% 38%, #fdfcf7 0%, #f0e2c2 70%, #e8d9b8 100%)',
  },

  // Domain-szókészlet — a gyűjthető elem megnevezése a UI-ban. Írd át a témádhoz.
  terminology: {
    cardSingular:   'kártya',
    cardPlural:     'Kártyák',
    collection:     'Gyűjtemény',
    collectionBook: 'Album',
    chapter:        'fejezet',
  },
};

export default config;
