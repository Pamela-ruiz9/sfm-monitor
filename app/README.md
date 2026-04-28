# SFM Monitor — Astro app (`v0.2.0-dev`)

Migración del dashboard SFM Monitor a **Astro 5 + React 19 + TypeScript strict**, corriendo junto al `../index.html` legacy durante la transición.

## Por qué junto al legacy

El dashboard actual (`../index.html`) está en producción en `pamela-ruiz9.github.io/sfm-monitor`. Cualquier link, cita o embed externo apunta ahí. Migrar de golpe rompe esos links. La estrategia:

1. Astro vive en `/sfm-monitor/app/` (subpath) durante migración → no toca el dashboard live
2. Migración chart por chart, validando paridad visual con Playwright (ver `docs/migration-astro.md`)
3. Cutover en `v0.2.0`: `index.html` → `legacy/v0.1.0.html`, Astro toma el root

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
