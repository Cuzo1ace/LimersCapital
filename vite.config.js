import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon-180x180.png',
        'maskable-icon-512x512.png',
      ],

      manifest: {
        name: "Limer's Capital",
        short_name: 'Limers',
        description:
          'Caribbean DeFi education, trading & tokenization on Solana',
        theme_color: '#0d0e10',
        background_color: '#0d0e10',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['finance', 'education'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: "Limer's Capital — Caribbean DeFi",
          },
        ],
      },

      workbox: {
        // Precache the app shell (HTML, CSS, JS, fonts)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Main bundle is ~2.4MB — allow precaching (gzipped transfer is ~670KB)
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB

        // Runtime caching strategies for API calls
        runtimeCaching: [
          // ── Price data: stale-while-revalidate (show cached, refresh in background) ──
          {
            urlPattern: /^https:\/\/hermes\.pyth\.network\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pyth-prices',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.dexscreener\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dexscreener-prices',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.coingecko\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'coingecko-data',
              expiration: { maxEntries: 100, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── API proxy: network-first with 3s timeout (fallback to cache on slow connections) ──
          {
            urlPattern:
              /^https:\/\/limer-api-proxy\.solanacaribbean-team\.workers\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'limer-api-proxy',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── DeFi data: stale-while-revalidate (TVL, yields — okay if slightly stale) ──
          {
            urlPattern: /^https:\/\/(api|stablecoins|yields)\.llama\.fi\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'defillama-data',
              expiration: { maxEntries: 50, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Supabase: network-first (real-time data, but cache for offline) ──
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30, maxAgeSeconds: 300 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Crypto images: cache-first (logos rarely change) ──
          {
            urlPattern:
              /^https:\/\/(coin-images|assets)\.coingecko\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'crypto-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Google Fonts: cache-first (immutable resources) ──
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── Exchange rate data: stale-while-revalidate ──
          {
            urlPattern: /^https:\/\/open\.er-api\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'exchange-rates',
              expiration: { maxEntries: 10, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── World Bank data: cache-first (changes very rarely) ──
          {
            urlPattern: /^https:\/\/api\.worldbank\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'worldbank-data',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ── TTSE proxy: network-first with fallback ──
          {
            urlPattern:
              /^https:\/\/ttse-proxy\.solanacaribbean-team\.workers\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ttse-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 30, maxAgeSeconds: 600 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Don't precache source maps
        globIgnores: ['**/*.map'],

        // ── SPA navigation fallback ────────────────────────────────────
        // When the SW intercepts a navigation request (e.g. /trade, /learn)
        // and the request fails (offline, slow network, etc.), serve the
        // cached index.html so the client-side router can handle it.
        // Without this, users on flaky networks hit the SW's default offline
        // response instead of the app shell.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          // Same-origin paths that are NOT SPA routes
          /^\/assets\//,
          /^\/sw\.js/,
          /^\/workbox-/,
          /^\/manifest/,
          /^\/robots\.txt/,
          /^\/sitemap/,
          /^\/.*\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/,
        ],

        // Skip waiting — activate new SW immediately
        skipWaiting: true,
        clientsClaim: true,
      },

      // Dev options — enable SW in dev for testing
      devOptions: {
        enabled: false, // set to true to test SW in dev mode
      },
    }),
  ],

  build: {
    rollupOptions: {
      // @percolator/sdk is loaded dynamically at runtime only in live trading mode.
      // Its dependency on @solana/web3.js from a linked local path causes resolution
      // errors during build. Externalizing it lets the dynamic import() succeed at
      // runtime (where the package IS available) without blocking the build.
      external: ['@percolator/sdk'],
    },
  },

  server: {
    port: 3000,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
