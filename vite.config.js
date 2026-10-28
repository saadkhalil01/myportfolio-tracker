import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Local UI testing uses the deployed API; no local backend is started.
  server: {
    host: '127.0.0.1',
    proxy: {
      '/.netlify/functions': { target: 'https://myportfoliopsx.netlify.app', changeOrigin: true },
      '/api': { target: 'https://myportfoliopsx.netlify.app', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.png', 'app-icon.svg'],
      manifest: {
        name: 'MyPortfolio',
        short_name: 'MyPortfolio',
        description: 'Personal portfolio tracker — investments, stocks, growth, and net worth.',
        theme_color: '#1a2332',
        background_color: '#eef1f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png?v=blue-arrow',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png?v=blue-arrow',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-512x512.png?v=blue-arrow',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // API calls (Netlify functions) must always hit the network
        navigateFallbackDenylist: [/^\/api\//, /^\/\.netlify\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
