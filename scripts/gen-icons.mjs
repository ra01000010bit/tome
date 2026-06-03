#!/usr/bin/env node
// Semleges PWA/favicon ikonok generálása a public/ mappába (sharp).
// Futtatás: node scripts/gen-icons.mjs
// A „T" monogramos pergamen-arany lapka az _example téma alapértelmezett ikonja;
// saját témához cseréld le a public/ PNG-ket.

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
mkdirSync(PUBLIC, { recursive: true });

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f6efdc"/><stop offset="1" stop-color="#c9a961"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <rect x="22" y="22" width="468" height="468" rx="78" fill="none" stroke="#9b7e3a" stroke-width="9"/>
  <text x="256" y="366" font-family="Georgia, 'Times New Roman', serif" font-size="330" font-weight="700" text-anchor="middle" fill="#3a2a10">T</text>
</svg>`;

const targets = [
  ['favicon.png', 64],
  ['apple-touch-icon.png', 180],
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
];

for (const [name, size] of targets) {
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(join(PUBLIC, name));
  console.log('  ✓', name, `(${size}px)`);
}

// Safari pinned-tab maszk-ikon (monokróm sziluett)
const maskIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect x="96" y="120" width="320" height="56" rx="12"/>
  <rect x="228" y="120" width="56" height="280" rx="12"/>
</svg>`;
writeFileSync(join(PUBLIC, 'mask-icon.svg'), maskIcon);
console.log('  ✓ mask-icon.svg');
console.log('Done.');
