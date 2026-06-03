import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // A kártya-képeket NEM precache-eljük, mert egy új deploy után burst-ként
      // töltené be mindet egyszerre. Helyette runtime cache-ben telnek be
      // — vagy első megtekintéskor (Collection), vagy a háttér-prefetcher
      // (`src/engine/preloadCards.js`) idle-időben szépen csorgatva.
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // A SW alapból minden navigációs kérést az index.html-re irányít
        // (SPA fallback). A szerver-oldali route-okat (sync,
        // register, health) ki kell venni — különben a SW elnyeli őket,
        // és a böngésző a React app-ot kapja a szerveroldali HTML/JSON helyett.
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/sync(\/|$)/,
          /^\/register(\/|$)/,
          /^\/health(\/|$)/,
        ],
        runtimeCaching: [
          {
            urlPattern: /\/cards\/.*\.(png|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'card-images',
              expiration: {
                maxEntries: 200,            // max 200 kártya-kép
                maxAgeSeconds: 60 * 60 * 24 * 30,  // 30 nap
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Tome',
        short_name: 'Tome',
        description: 'Kártyagyűjtős, spaced-repetition tanulójáték-keret.',
        theme_color: '#faf6f3',
        background_color: '#faf6f3',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
  },
  build: {
    // Kisebb chunkok = jobb cache-elés (egy framer-motion frissítés nem invalidálja az egészet)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return undefined;
          }
          // A tananyag-tartalom (topic JSON-ok) kulon chunkba: tartalom-frissites
          // nem invalidalja az app-kodot es forditva (jobb cache-eles).
          if (id.includes('/themes/') && id.endsWith('.json')) return 'content';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
