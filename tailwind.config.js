/** @type {import('tailwindcss').Config} */
//
// Generikus paletta: a paletta-értékek CSS-változókban élnek (--c-primary-500, …).
// A téma index.css-ben/JS-ből beállítja ezeket. Téma cseréje ⇒ csak az értékek
// változnak, a Tailwind osztály-nevek (bg-primary-500 stb.) maradnak.
//
// Szerkezet egy szín alatt:
//   primary: { 500: 'rgb(var(--c-primary-500) / <alpha-value>)' }

const palette = (name, shades) =>
  Object.fromEntries(shades.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Generikus, téma-független nevek ─────────────────────────────────
        primary:   palette('primary',   [50,100,200,300,400,500,600,700,800,900]),
        secondary: palette('secondary', [50,100,200,300,400,500,600,700,800,900]),
        base:      palette('base',      [50,100,200,300,400,500]),
        ink:       palette('ink',       [400,500,600,700,800,900]),
        accent:    palette('accent',    [200,300,400,500,600,700]),
        warm:      palette('warm',      [200,300,400,500,600]),
        leaf:      palette('leaf',      [400,500,600,700]),
      },
      fontFamily: {
        display:  ['var(--font-display)',  'Cinzel', 'Georgia', 'serif'],
        body:     ['var(--font-body)',     '"Cormorant Garamond"', 'Georgia', 'serif'],
        script:   ['var(--font-script)',   'Italianno', 'cursive'],
      },
      letterSpacing: {
        'display': '0.18em',
      },
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        unlock: {
          '0%':   { opacity: '0', transform: 'scale(0.5) rotate(-10deg)' },
          '60%':  { transform: 'scale(1.1) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
      animation: {
        bob:     'bob 2s ease-in-out infinite',
        unlock:  'unlock 0.7s ease-out forwards',
        shimmer: 'shimmer 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
