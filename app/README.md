# SFM Monitor — Astro app (`v0.2.0-dev.1`)

App-like redesign + PWA del dashboard SFM Monitor en **Astro 5 + React 19 + TypeScript strict**, target deploy en custom domain (`sfmrisk.mx` por defecto, ver `public/CNAME`).

> Para el inventario completo de features, paleta, componentes y métricas, ver `../CHANGELOG.md` `[0.2.0-dev.1]`. Este README es un quickstart.

## Hosting

- **Site canónico**: `https://sfmrisk.mx` (`astro.config.ts` → `site` y `public/CNAME`)
- **Base path**: `/`
- **Legacy** `../index.html` sigue accesible en `https://pamela-ruiz9.github.io/sfm-monitor/` — son sitios separados, no compiten

Para cambiar el dominio target:
1. Editar `public/CNAME` con el dominio nuevo
2. Editar `astro.config.ts` → `SITE`
3. Configurar DNS apuntando a Cloudflare Pages / GitHub Pages
4. Esperar propagación + cert SSL automático

## Quick start

```bash
cd app
npm install              # primera vez (~430 paquetes)
npx playwright install chromium   # primera vez para E2E
npm run dev              # http://localhost:4321
npm run build            # astro check + build estático a dist/ (incluye SW)
npm run preview          # sirve dist/ localmente
npm test                 # vitest run (24 unit tests)
npm run test:e2e         # playwright (15 desktop tests)
npm run lighthouse       # lhci autorun contra dist/
```

## Estructura

```
app/
├── astro.config.ts                          ← config + AstroPWA + i18n es/en
├── tsconfig.json                            ← TS strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
├── vitest.config.ts                         ← unit testing config (~ alias, jsdom)
├── playwright.config.ts                     ← E2E config (desktop + mobile projects)
├── lighthouserc.json                        ← Lighthouse CI thresholds
├── public/
│   ├── manifest.webmanifest                 ← PWA manifest
│   ├── icons/                               ← icon-192/512 + maskable variants (placeholders 1×1 por ahora)
│   ├── apple-touch-icon.png
│   └── CNAME                                ← sfmrisk.mx
├── src/
│   ├── env.d.ts
│   ├── types/branded.ts                     ← Percentage, BasisPoints, Currency, SeriesId, IsoDate
│   ├── styles/global.css                    ← Tailwind v4 + tokens legacy (gold/green/yellow/red)
│   ├── lib/utils.ts                         ← cn, formatMxn, formatPct, computeDelta, ddmmyyyyToIso
│   ├── data/
│   │   ├── schema.ts                        ← Zod root schema para sfm-data.json
│   │   ├── loader.ts                        ← parse + cache build-time, fail-loud
│   │   ├── indicators.ts                    ← registry: 13 indicators con aliases
│   │   └── alerts.ts                        ← rule engine (inflation OOB, IFRS9 stage 2 trend)
│   ├── stores/                              ← nanostores
│   │   ├── activeTab.ts                     ← URL pathname sync
│   │   ├── drawerState.ts                   ← URL ?indicator= sync
│   │   ├── terminalMode.ts                  ← localStorage persistent (UI deferred)
│   │   └── onboarding.ts                    ← visit count + tour done flag
│   ├── layouts/Layout.astro                 ← shell con named slots + ClientRouter (View Transitions)
│   ├── components/
│   │   ├── DataFreshnessBadge.tsx
│   │   ├── shell/
│   │   │   ├── Header.astro                 ← sticky logo + ⌘K trigger + freshness badge
│   │   │   ├── TabBar.astro                 ← desktop horizontal tabs
│   │   │   ├── BottomNav.astro              ← mobile bottom nav (lg:hidden)
│   │   │   ├── CmdKPalette.tsx              ← cmdk lib palette
│   │   │   ├── PWAInstallPrompt.tsx         ← beforeinstallprompt + iOS Share fallback
│   │   │   ├── OnboardingTour.tsx           ← driver.js 4-step tour
│   │   │   ├── SwipeNav.tsx                 ← swipe horizontal entre tabs
│   │   │   ├── PullToRefresh.tsx
│   │   │   └── UpdateToast.tsx              ← SW auto-update notification
│   │   ├── chrome/
│   │   │   ├── Section.astro                ← eyebrow + title + source + tone-tinted card
│   │   │   └── EditorialHeadline.astro      ← serif hero headline
│   │   ├── kpi/
│   │   │   ├── KpiCard.tsx                  ← Cormorant value, delta con upIsGood semantic
│   │   │   └── KpiHero.tsx                  ← variante hero más grande
│   │   ├── drawer/
│   │   │   ├── ChartDrawer.tsx              ← vaul Drawer.Root, URL-synced
│   │   │   ├── DrawerMetadata.tsx
│   │   │   └── DrawerExport.tsx
│   │   ├── alerts/AlertsPanel.astro
│   │   └── charts/
│   │       ├── FXChart.tsx                  ← Chart.js island
│   │       ├── TasaBanxicoChart.tsx
│   │       ├── InflacionChart.tsx
│   │       └── ChartErrorBoundary.tsx
│   └── pages/
│       ├── index.astro                      ← Resumen tab
│       ├── mercado.astro                    ← FX + Tasa + TIIE placeholder
│       ├── credito.astro                    ← placeholder hasta M2
│       ├── sofipos.astro                    ← placeholder hasta M3
│       └── macro.astro                      ← Inflación
└── tests/
    ├── unit/                                ← vitest (24 tests)
    │   ├── utils.test.ts
    │   ├── schema.test.ts
    │   ├── indicators.test.ts
    │   └── alerts.test.ts
    └── e2e/                                 ← Playwright (15 desktop tests)
        ├── tabs.spec.ts
        ├── drawer.spec.ts
        ├── cmdk.spec.ts
        └── visual.spec.ts                   ← + visual.spec.ts-snapshots/ baselines
```

## Decisiones técnicas (más detalle en `../docs/research/blueprint-2026.md` y `../docs/superpowers/specs/2026-04-27-app-like-redesign-pwa-design.md`)

- **Astro vs Next.js**: ship 0KB JS por defecto, MPA nativo, View Transitions API gratis
- **TS strict** + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`: catch financial unit bugs en compile time
- **Branded types** (`Percentage`, `BasisPoints`, `Currency`, `SeriesId`): no se mezclan accidentalmente
- **Zod en un solo punto** (`data/loader.ts`): la JSON entra una vez, el resto del código consume tipos validados
- **Chart.js mantenido** durante migración para paridad visual con legacy; en M4+ migrar por chart a ECharts (heatmap), Lightweight Charts (FX candle), uPlot (series largas) según blueprint §6
- **Tailwind v4** con `@theme` directive (sin `tailwind.config.js` legacy)
- **vaul** para drawer, **cmdk** para palette, **driver.js** para onboarding, **@vite-pwa/astro** para SW
- **nanostores** sobre Zustand/Jotai por ser ~300B y multi-framework

## Tabs

| Ruta | Contenido | Status |
|---|---|---|
| `/` | Resumen ejecutivo: editorial headline + 4 KPIs + featured FX chart + alerts panel | ✅ |
| `/mercado` | FX + Tasa Banxico (charts) + TIIE 28d placeholder | ✅ |
| `/credito` | Placeholder con CTA al estable | 📋 M2 |
| `/sofipos` | Placeholder con CTA al estable | 📋 M3 |
| `/macro` | Inflación INPC con banda Banxico | ✅ |

## Charts migradas

| Chart | Estado | Componente |
|---|---|---|
| FX MXN/USD histórico | ✅ | `charts/FXChart.tsx` |
| Tasa Banxico (stepped) | ✅ | `charts/TasaBanxicoChart.tsx` |
| Inflación INPC + banda 3% ±1pp | ✅ | `charts/InflacionChart.tsx` |
| TIIE 28d | 📋 M2 | — (placeholder en `/mercado`) |
| IMOR Banca histórico | 📋 M2 | — |
| IMOR por segmento | 📋 M2 | — |
| IMOR por banco G-7 | 📋 M2 | — |
| IFRS 9 etapas | 📋 M3 | — |
| SoFiPOs IMOR top 15 | 📋 M3 | — |
| SoFiPOs IMORA/ROA | 📋 M3 | — |

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Astro dev server con HMR en `:4321` |
| `npm run build` | `astro check` (TS strict + Zod) + build estático a `dist/` (incluye PWA SW) |
| `npm run preview` | Sirve `dist/` localmente |
| `npm run typecheck` | `tsc --noEmit` standalone |
| `npm test` | Vitest unit tests (24 pass) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run test:e2e` | Playwright E2E (15 desktop tests) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run lighthouse` | `lhci autorun` con `lighthouserc.json` thresholds |

## Pendiente

Ver `../CHANGELOG.md` `[Sin publicar]` y `../docs/migration-astro.md` para roadmap completo. Resumen:

- 6 charts CNBV pendientes (M2-M3) → Crédito y SoFiPOs siguen como placeholders
- Reemplazar PWA icons placeholder 1×1 por íconos reales
- M4 features citables: `<CitationBox>`, `<MetricTooltip>`, JSON-LD `Dataset` por indicador, OG dinámico
- Modo Terminal toggle UI (store ya existe)
- Mobile Playwright (webkit no instalado en CI)
