import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Custom domain target — adjust if a different one is registered.
// CNAME file at app/public/CNAME drives GitHub Pages / Cloudflare Pages
// to serve from this hostname. Until DNS is wired, the dev/preview URLs
// still work from localhost — `site` only affects canonical/sitemap.
const SITE = 'https://sfmrisk.mx';

const BASE = '/';

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
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
