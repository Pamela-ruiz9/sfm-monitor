# Changelog

Todas las versiones notables de SFM Monitor se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** si cambia el schema de `data/sfm-data.json` de forma incompatible
- **MINOR** si se añaden indicadores o features sin romper compatibilidad
- **PATCH** si solo se refrescan datos o se corrigen bugs

---

## [Sin publicar]

### Por hacer (no bloqueado por migración Astro)
- DOI persistente vía Zenodo — requiere paso manual (ver `docs/citability.md`)
- Pipeline CNBV CSV automatizado (R12A IFRS9, SoFiPOs R11)
- Integración Banxico API para inflación subyacente (SP74625)
- M2-M3 de migración Astro: 6 charts CNBV pendientes (Crédito + SoFiPOs siguen como placeholders)
- M4 features citables: `<CitationBox>` UI, `<MetricTooltip>` glosario, JSON-LD `Dataset` por indicador, OG dinámico con Satori
- Reemplazar PWA icons placeholder (1×1 PNG) por íconos reales y activar `categories:pwa` en `lighthouserc.json`
- Modo Terminal toggle UI (store ya existe en `terminalMode.ts`)

---

## [0.2.0-dev.1] — 2026-04-27

App-like redesign + PWA. Ver spec en `docs/superpowers/specs/2026-04-27-app-like-redesign-pwa-design.md` y plan en `docs/superpowers/plans/2026-04-27-app-like-redesign-pwa.md`. Implementado en branch `feat/app-redesign-pwa-v0.2.0-dev` (PR #1).

### Stack añadido (ver `app/package.json`)
- `vaul` — drawer / bottom sheet
- `cmdk` — command palette
- `@nanostores/react` + `@nanostores/persistent` — state + localStorage sync
- `@vite-pwa/astro` + `workbox-window` — service worker + manifest + auto-update
- `@use-gesture/react` — swipe + pull-to-refresh gestures
- `driver.js` — onboarding tour
- `vitest` + `@testing-library/react` + `jsdom` — unit testing
- `@playwright/test` — E2E + visual regression
- `@lhci/cli` — Lighthouse CI

### Routing & shell
- 5 routed tabs: `/`, `/mercado`, `/credito`, `/sofipos`, `/macro` (Astro file-based)
- `Layout.astro` reescrito con `<ClientRouter />` (View Transitions API), named slots: `header`, `footer`, `drawer`, `cmdk`, `update-toast`, `install-prompt`, `onboarding`, `gestures`, `bottom-nav`
- `Header.astro` — sticky, gold logo mark serif, DataFreshnessBadge, ⌘K trigger
- `TabBar.astro` — desktop horizontal (`hidden lg:block`)
- `BottomNav.astro` — mobile fixed bottom (`lg:hidden`), safe-area-inset
- Custom domain target `sfmrisk.mx` (CNAME en `app/public/CNAME`)

### Visual system (legacy palette)
- Tokens migrados a paleta exacta del `index.html` legacy: `--color-bg #0d1117`, `--color-gold #c4a35a`, `--color-green #3fb950`, `--color-yellow #d29922`, `--color-red #f85149`. Cero azul/cyan en KPIs.
- Tipografía: Cormorant Garamond serif para KPI values + headlines; Inter para UI; JetBrains Mono para tickers/IDs
- Card primitive `.card-surface` con `data-tone` para tinte de border
- `chrome/Section.astro` y `chrome/EditorialHeadline.astro` reemplazan los anteriores `Hero/Sidebar/Section`

### KPIs y datos
- `kpi/KpiCard.tsx` y `kpi/KpiHero.tsx` con tones gold/green/yellow/red, valor mono Cormorant 38px clamp responsive, delta con `upIsGood` semantic
- `data/indicators.ts` — registry de 13 indicadores (FX, Tasa, TIIE28, Inflación, IMOR, IMORA, ICOR, ROA, ROE, IFRS9, SoFiPOs IMOR/IMORA/ROA) con aliases para búsqueda y métadatos para drawer
- `data/alerts.ts` — engine de reglas (inflation-out-of-band, ifrs9-stage2-rising)
- `alerts/AlertsPanel.astro` — server-rendered, lista con dots de severidad luminosos
- `chrome/EditorialHeadline.astro` con eyebrow + headline editorial estilo OWID/FT

### Drawer pattern
- `drawer/ChartDrawer.tsx` con `vaul` — modal full-height mobile / right-side desktop
- URL-synced via `?indicator=fx` (deep-linkable), `Esc` y swipe-down dismissable
- `DrawerMetadata.tsx` con fórmula, fuente, código serie, tab
- `DrawerExport.tsx` con descarga JSON (PNG/CSV deferred)
- Trigger universal: cualquier elemento con `[data-drawer-trigger="<id>"]` abre el drawer
- Vista de chart dentro del drawer es placeholder hasta migración completa de charts

### Cmd+K palette
- `shell/CmdKPalette.tsx` con `cmdk` lib
- Búsqueda por nombre, alias, código Banxico SIE (ej. `SF43718`)
- Trigger: `⌘K` / `Ctrl+K` keybind o click en `[data-cmdk-trigger]` (botón en header)

### PWA
- `public/manifest.webmanifest` con name, theme_color #0d1117, icons 192/512 + maskable, lang es-MX
- Service worker generado por workbox: NetworkFirst para `/data/*.json` (timeout 3s), StaleWhileRevalidate para fonts (rsms.me + Google Fonts), precache de assets
- `shell/UpdateToast.tsx` — auto-update notification con botón "Refrescar"
- `shell/PWAInstallPrompt.tsx` — banner discreto gated por `visit count >= 2`, fallback iOS con instrucciones Share + Add to Home Screen
- Íconos actuales son placeholders 1×1 (Lighthouse PWA category off hasta reemplazar)

### Onboarding
- `shell/OnboardingTour.tsx` con `driver.js` — 4 pasos (Hero → KPI cards → tabs → Cmd+K)
- Persistido via `localStorage.sfm-onboarding-done`

### Mobile gestures
- `shell/SwipeNav.tsx` — swipe horizontal entre tabs (50px threshold, axis-locked)
- `shell/PullToRefresh.tsx` — pull desde top con 80px threshold, indicador gold luminoso

### Error handling
- `charts/ChartErrorBoundary.tsx` — React class boundary por chart, fallback con link a dashboard estable
- Aplicado a FXChart, TasaBanxicoChart, InflacionChart

### Stores (nanostores)
- `stores/activeTab.ts` — sincronizado con URL pathname y `astro:after-swap`
- `stores/drawerState.ts` — sincronizado con URL `?indicator=` query string
- `stores/terminalMode.ts` — persistente, UI deferred a v0.3.0
- `stores/onboarding.ts` — `$onboardingDone` + `$visitCount` + `bumpVisitCount()`

### Testing
- Vitest config con `~` alias y jsdom env
- 24 unit tests pass: `utils.test.ts` (12), `schema.test.ts` (1, valida `data/sfm-data.json` real), `indicators.test.ts` (7), `alerts.test.ts` (4)
- Playwright config con desktop (1280×720) + mobile (iPhone 13) projects
- 15/15 desktop E2E tests pass: `tabs.spec.ts` (5 routes smoke), `drawer.spec.ts` (3), `cmdk.spec.ts` (2), `visual.spec.ts` (5 baselines)
- Mobile E2E project skipped por ahora (webkit no instalado)
- Lighthouse CI config (`app/lighthouserc.json`) con thresholds Perf 0.90 / A11y 0.95 / BP 0.95 / SEO 0.95

### CI
- `.github/workflows/test.yml`: build + unit + Playwright desktop + Lighthouse CI; corre en PR + push a main que toquen `app/**`

### Lighthouse desktop (5 routes, single run, todas pasan thresholds)
| Route | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| / | 0.97 | 1.00 | 0.96 | 1.00 |
| /mercado | 1.00 | 1.00 | 0.96 | 1.00 |
| /credito | 0.99 | 1.00 | 0.96 | 1.00 |
| /sofipos | 1.00 | 1.00 | 0.96 | 1.00 |
| /macro | 1.00 | 1.00 | 0.96 | 1.00 |

### Removido / movido
- `app/src/components/Hero.astro`, `Sidebar.astro`, `Section.astro` (root) — reemplazados por `chrome/`
- `app/src/components/KpiCard.tsx` (root) — movido a `kpi/KpiCard.tsx`

### Notas
- Crédito y SoFiPOs siguen siendo placeholder cards con CTA al dashboard estable hasta que M2-M3 migre los charts CNBV
- Tag local `v0.2.0-dev.1` (push manual cuando se merge el PR #1)

---

## [0.1.0] — 2026-04-27

Primera versión etiquetada del dashboard. Snapshot del trabajo previo no versionado, congelado para ser citable como artefacto de partida antes de la migración a Astro.

### Añadido
- Dashboard `index.html` (HTML/CSS/JS estático) con 4 módulos: Riesgo de Crédito, Riesgo de Mercado, Contexto Macro, Comparativo SoFiPOs vs Banca Múltiple
- 9 charts con Chart.js 4 + chartjs-plugin-annotation
- Datos consolidados en `data/sfm-data.json` (Banxico + CNBV procesados)
- Datos crudos por institución en `raw-data/cnbv_indicadores.json`, `raw-data/sofipos_by_inst.json`, `raw-data/imor_historico.json`
- Catálogo CNBV Sector 40 en `data/Raw_data/cat_instituciones_40.csv`
- GitHub Action `update-data.yml` con cron diario L-V 8:00 AM CDMX para refrescar Banxico (FX SF43718, tasa SF61745, TIIE SF43783, INPC SP74625)
- Roadmap interactivo en `roadmap.html`
- Documentación estratégica en `docs/research/blueprint-2026.md` (212 líneas, blueprint integral de stack y metodología)
- Roadmaps tácticos en `docs/roadmap-contenido.md` y `docs/roadmap-infraestructura.md`
- Doble licenciamiento: código MIT (`LICENSE`), contenido y datos derivados CC-BY 4.0 (`LICENSE-CONTENT`)
- `CITATION.cff` con coautoría (Ingrid Pamela Ruiz Puga + Artemio Padilla)
- `JSON-LD Dataset` markup para indexación en Google Scholar y Google Dataset Search
- `.zenodo.json` con metadatos para registro de DOI persistente

### Indicadores cubiertos
- **Banca Múltiple (desde dic 2000)**: IMOR total y por segmento (comercial, consumo, vivienda, tarjeta), IMOR por banco G-7, IMORA, ICOR, ROA, ROE
- **IFRS 9 (desde ene 2022)**: distribución cartera por etapa 1/2/3
- **SoFiPOs (desde ene 2016)**: IMOR por institución y por segmento, ROA, IMORA — top 15 por activo
- **Mercado**: FX MXN/USD desde 1994 (Banxico SF43718), tasa objetivo Banxico (SF61745), TIIE 28d (SF43783)
- **Macro**: inflación anual calculada del INPC (SP74625)

### Notas de versionado
Esta versión se etiqueta como `0.1.0` (no `1.0.0`) porque:
- El stack es legacy (HTML estático monolítico de 3,300+ líneas) y será reemplazado en `0.2.0` por Astro
- Falta TypeScript strict, Zod schemas, branded types
- Falta cutover de pipeline a uv + Polars + Pandera + Pydantic v2
- Faltan integraciones de fuentes documentadas en blueprint: BIS credit-to-GDP, IMF FSI cross-country, INEGI BIE post-migración

`v1.0.0` se reservará para el dashboard ya migrado a Astro con las 7 features citables del blueprint completas (DOI, JSON-LD, citation generator, fichas metodológicas, glosario, status page, doble licencia).

[Sin publicar]: https://github.com/Pamela-ruiz9/sfm-monitor/compare/v0.2.0-dev.1...HEAD
[0.2.0-dev.1]: https://github.com/Pamela-ruiz9/sfm-monitor/releases/tag/v0.2.0-dev.1
[0.1.0]: https://github.com/Pamela-ruiz9/sfm-monitor/releases/tag/v0.1.0
