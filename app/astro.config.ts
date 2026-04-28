import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://pamela-ruiz9.github.io';

// During migration the Astro app is served from a subpath so it can coexist
// with the legacy index.html at the repo root. After cutover (see
// docs/cutover.md) the base will change to '/sfm-monitor/' or sfmrisk.mx root.
const BASE = '/sfm-monitor/app';

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
