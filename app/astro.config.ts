import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

// Custom domain target — adjust if a different one is registered.
// CNAME file at app/public/CNAME drives GitHub Pages / Cloudflare Pages
// to serve from this hostname. Until DNS is wired, the dev/preview URLs
// still work from localhost — `site` only affects canonical/sitemap.
const SITE = 'https://pamela-ruiz9.github.io';

const BASE = '/sfm-monitor';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  output: 'static',
  build: {
    format: 'directory',
    assets: '_assets',
  },
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      en: 'es',
    },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-MX', en: 'en-US' },
      },
    }),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: false, // we ship manifest.webmanifest manually
      workbox: {
        // skipWaiting + clientsClaim: el SW nuevo toma control inmediatamente
        // en cada deploy, evitando el error "Unable to preload CSS for /_assets/X.css"
        // que ocurre cuando el SW viejo cachea assets con hash diferente al nuevo build.
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sfm-data',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/(rsms\.me|fonts\.(googleapis|gstatic)\.com)/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sfm-fonts' },
          },
        ],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
