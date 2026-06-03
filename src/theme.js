// Aktív téma kiválasztása. Új témára váltáshoz cseréld ki ezt az egy sort.
// A téma egy mappa a src/themes/-ben (ld. _example a sablonért).

export * from './themes/_example/index.js';
export { default as themeConfig } from './themes/_example/theme.config.js';
export { default as COPY } from './themes/_example/copy.js';
