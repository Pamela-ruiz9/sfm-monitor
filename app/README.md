# SFM Monitor — Astro app (`v0.2.0-dev`)

Migración del dashboard SFM Monitor a **Astro 5 + React 19 + TypeScript strict**, target deploy en **custom domain** (`sfmrisk.mx` por defecto, ver `public/CNAME`).

## Hosting

- **Site canónico**: `https://sfmrisk.mx` (definido en `astro.config.ts` → `site`, y en `public/CNAME`)
- **Base path**: `/` (root del dominio, sin subpath)
- **Legacy** `../index.html` sigue accesible en `https://pamela-ruiz9.github.io/sfm-monitor/` mientras GitHub Pages del repo siga apuntando ahí — son sitios separados, no compiten

Para cambiar el dominio target (ej. otro nombre disponible):
1. Editar `public/CNAME` con el dominio nuevo
2. Editar `astro.config.ts` → `SITE`
3. Configurar el CNAME en el DNS provider apuntando a Cloudflare Pages / GitHub Pages
4. Esperar propagación + cert SSL automático

## Quick start

```bash
cd app
npm install        # primera vez (~200MB de node_modules)
npm run dev        # http://localhost:4321/sfm-monitor/app/
npm run build      # build a dist/ (incluye astro check con type-check estricto)
npm run typecheck  # tsc --noEmit standalone
```

## Estructura

```
app/
├── astro.config.ts          ← config con i18n es/en, base /sfm-monitor/app
├── tsconfig.json            ← TS strict + noUncheckedIndexedAccess
├── src/
│   ├── env.d.ts
│   ├── types/branded.ts     ← Percentage, BasisPoints, SeriesId, ...
│   ├── data/
│   │   ├── schema.ts        ← Zod schemas para sfm-data.json
│   │   └── loader.ts        ← parse + cache build-time
│   ├── styles/global.css    ← Tailwind v4 + tokens SFM
│   ├── layouts/
│   │   └── Layout.astro     ← shell con header/footer/SEO
│   ├── components/
│   │   ├── DataFreshnessBadge.tsx
│   │   └── charts/
│   │       └── FXChart.tsx  ← POC: Chart.js como isla client:visible
│   └── pages/
│       └── index.astro
└── public/                  ← assets estáticos (favicon, og images)
```

## Decisiones técnicas (más detalle en `../docs/research/blueprint-2026.md`)

- **Astro vs Next.js**: ship 0KB JS por defecto (cada chart es isla); Content Collections type-safe para fichas metodológicas; MDX nativo
- **TS strict** + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`: catch financial unit bugs en compile time
- **Branded types** (`Percentage`, `BasisPoints`, `Currency`, `SeriesId`): no se pueden mezclar accidentalmente
- **Zod en un solo punto** (`data/loader.ts`): la JSON entra una vez, el resto del código consume tipos validados
- **Chart.js mantenido** durante migración para paridad visual con legacy; futura migración por chart a ECharts (heatmap), Lightweight Charts (FX candle), uPlot (series largas) según blueprint §6
- **Tailwind v4** con `@theme` directive (sin `tailwind.config.js` legacy)

## Charts migradas

| Chart | Estado | Componente |
|---|---|---|
| FX MXN/USD histórico | ✅ POC | `components/charts/FXChart.tsx` |
| Tasa Banxico + TIIE | 📋 pendiente | — |
| Inflación INPC | 📋 pendiente | — |
| IMOR Banca Múltiple | 📋 pendiente | — |
| IMOR por segmento | 📋 pendiente | — |
| IMOR por banco G-7 | 📋 pendiente | — |
| IFRS 9 etapas | 📋 pendiente | — |
| SoFiPOs IMOR top 15 | 📋 pendiente | — |
| SoFiPOs IMORA/ROA | 📋 pendiente | — |

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Astro dev server con HMR |
| `npm run build` | `astro check` (type-check con Zod en data) + build estático a `dist/` |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run typecheck` | `tsc --noEmit` standalone |
