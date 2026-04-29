# Migración HTML → Astro 5

Plan operativo de migración del `index.html` monolítico (~3,300 líneas) a Astro 5 + React 19 + TypeScript strict, **sin romper el dashboard live durante la transición**.

## Estrategia: convivencia, no big-bang

```
sfm-monitor/                          Producción hoy        Producción durante migración
├── index.html       ← legacy        /sfm-monitor/         /sfm-monitor/  (sin cambios)
├── data/sfm-data.json ← shared      consumido por legacy  consumido por ambos
├── app/             ← Astro nuevo   no existe             /sfm-monitor/app/  (preview)
│   └── dist/                                              build alternativo
└── .github/workflows/
    ├── update-data.yml ← existing   refresca JSON         refresca JSON
    └── deploy.yml      ← nuevo      publica HTML          publica HTML + Astro app
```

Hasta el cutover, `pamela-ruiz9.github.io/sfm-monitor` sigue sirviendo el `index.html` exactamente como hoy. La preview Astro vive en `/sfm-monitor/app/` y se itera ahí sin afectar usuarios actuales.

## Sprints de migración

### ✅ Sprint M0 — bootstrap (este commit)

- [x] `app/package.json` con Astro 5 + React 19 + TS + Tailwind v4 + Zod
- [x] `app/tsconfig.json` strict + noUncheckedIndexedAccess
- [x] `app/astro.config.ts` con i18n es/en + base subpath
- [x] `app/src/types/branded.ts` (Percentage, BasisPoints, Currency, SeriesId)
- [x] `app/src/data/schema.ts` Zod root schema
- [x] `app/src/data/loader.ts` con cache + fail-loud
- [x] `app/src/layouts/Layout.astro` shell con SEO básico
- [x] `app/src/components/DataFreshnessBadge.tsx` (semáforo de frescura)
- [x] `app/src/components/charts/FXChart.tsx` POC (Chart.js como isla)
- [x] `app/src/pages/index.astro` con FX chart funcionando

**Acción manual pendiente**: Pame corre `cd app && npm install` (primera vez) y `npm run dev` para validar que el FX chart renderiza con datos reales. Si falla, ajustar Zod schema (`schema.ts` usa `passthrough` en CNBV/IFRS9/SoFiPOs precisamente para no bloquear esta primera corrida).

### ✅ Sprint M1 — paridad de charts simples (DONE en v0.2.0-dev.1, PR #1)

- [x] `TasaBanxicoChart.tsx` — stepped line de tasa objetivo
- [x] `InflacionChart.tsx` — INPC anual con banda Banxico 3% ±1pp
- [x] Validación visual: 5 baseline screenshots Playwright en `app/tests/e2e/visual.spec.ts-snapshots/`
- [x] Test snapshot con Playwright `toHaveScreenshot()` corriendo en CI

### ✅ Sprint M1.5 — app-like redesign + PWA (DONE en v0.2.0-dev.1, PR #1)

Ver `docs/superpowers/specs/2026-04-27-app-like-redesign-pwa-design.md` y CHANGELOG entry `[0.2.0-dev.1]`.

- [x] 5 tabs ruteadas con Astro file-based + View Transitions API
- [x] Header sticky + TabBar desktop + BottomNav mobile
- [x] ChartDrawer con vaul + URL-synced ?indicator=
- [x] Cmd+K palette con cmdk + indicator registry (13 indicadores)
- [x] AlertsPanel server-rendered con engine de reglas
- [x] KpiCard + KpiHero con paleta legacy + Cormorant serif
- [x] PWA: manifest + service worker (workbox) + UpdateToast
- [x] PWAInstallPrompt + iOS Share fallback gated por visit count
- [x] OnboardingTour con driver.js
- [x] SwipeNav + PullToRefresh mobile gestures
- [x] ChartErrorBoundary por chart con fallback link
- [x] 4 nanostores (activeTab, drawerState, terminalMode, onboarding)
- [x] 24 vitest tests + 15 Playwright desktop tests + Lighthouse CI

### Sprint M2 — charts CNBV (cartera + bancos)

Tightear `CreditoSchema` en `schema.ts` con shapes reales (quitar `passthrough`):

- [ ] `ImorHistoricoChart.tsx` — IMOR Banca Múltiple desde 2000
- [ ] `ImorSegmentoChart.tsx` — comercial/consumo/vivienda/tarjeta (multi-line)
- [ ] `ImorBancoG7Chart.tsx` — BBVA/Banamex/Santander/Banorte/HSBC/Scotiabank/Inbursa
- [ ] Tabla `<BancosTable>` con TanStack Table v8 virtualizada

### Sprint M3 — IFRS 9 + SoFiPOs

- [ ] `Ifrs9StagesChart.tsx` — stacked area etapa 1/2/3
- [ ] `SofiposImorChart.tsx` — top 15 por activo, Y axis fijo en 45%
- [ ] `SofiposImoraRoaChart.tsx` — IMORA + ROA dual-axis

### Sprint M4 — features citables del blueprint

- [ ] Content Collection `indicators` con MDX (ficha por IMOR/IMORA/ICOR/etc.)
- [ ] `<MetricTooltip>` con Floating UI (glosario hover)
- [ ] `<CitationBox>` con APA/Chicago/MLA/BibTeX/RIS
- [ ] JSON-LD `@type: Dataset` por página de indicador
- [ ] OG dinámico con Satori
- [ ] `nuqs` para URL state (filtros)
- [ ] `<ExportMenu>` PNG/SVG/CSV/PDF con metadata embebida

### Sprint M5 — cutover (ver `cutover.md`)

Solo cuando M1–M4 estén completos y Playwright valide paridad pixel-perfect en las 9 charts.

## Decisiones de stack ya tomadas

| Decisión | Por qué |
|---|---|
| Astro 5 (no Next.js) | Ship 0KB JS por default, MPA nativo perfecto para dashboard mostly-static, Cloudflare adquirió Astro en 2026 |
| React 19 (no Solid/Svelte) | Pame ya conoce React; ecosistema chart libraries; islas en Astro |
| TS strict | Branded types catch unit bugs financieros (% vs bps vs ratio) |
| Zod v4 (no Valibot) | Integración nativa con Astro Content Collections |
| Tailwind v4 (no v3) | Engine Oxide 3-5× más rápido, sin `tailwind.config.js` |
| Chart.js mantenido (transición) | Paridad visual durante migración; reemplazar después chart por chart |
| ~~Subpath `/sfm-monitor/app/`~~ → `base: '/'` + custom domain | Cambio en v0.2.0-dev: app target `sfmrisk.mx` con CNAME, no subpath GitHub Pages |
| GitHub Pages legacy + Cloudflare Pages target | Legacy sigue en `pamela-ruiz9.github.io/sfm-monitor/`; Astro app va a custom domain |

## Patrones a respetar

- **Cada chart = isla `client:visible`** o `client:idle` (excepto `client:load` si requiere SSR data, que no es el caso aquí)
- **Datos parsed por Zod en `loader.ts`** — el resto del código consume `SfmData` typed
- **Branded types en cualquier API pública** de funciones financieras
- **Nunca importar `'../../data/sfm-data.json'` directamente** desde un componente — siempre vía `loader.ts`
- **Crisis annotations** vienen de `data.historico.crisis_mexico` (centralizadas, no hardcodeadas en cada chart)

## Costo estimado de la migración completa

- Tiempo: 4–6 sprints (~2–3 semanas calendario, part-time)
- Costo en tokens (sin subagentes): ~$5–10 USD distribuidos
- Costo si se hiciera con subagente Codex de un golpe: ~$30–50 USD
- **Recomendación**: incremental, sin subagentes
