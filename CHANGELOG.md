# Changelog

Todas las versiones notables de SFM Monitor se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/):

- **MAJOR** si cambia el schema de `data/sfm-data.json` de forma incompatible
- **MINOR** si se añaden indicadores o features sin romper compatibilidad
- **PATCH** si solo se refrescan datos o se corrigen bugs

---

## [Sin publicar]

### fix(data): TIIE serie SF343410 → SF43783 + IMOR/IMORA sentinelas ≥100% → null (2026-05-31)
- `update-data.yml`: cambia serie TIIE de SF343410 (retornaba ~17%, serie incorrecta) a SF43783 (TIIE 28d establecida); el dato en JSON se corregirá en la siguiente corrida del action
- `scripts/normalize-imor-por-banco.py`: si `imor_total` o `imora_total` ≥ 100.0 después del multiplicador ×100, se guarda como `null`; el CNBV codifica periodos sin datos como raw=1.0, lo que producía valores centinela de exactamente 100% (afectaba HSBC, Scotiabank y ~15 bancos pequeños en 2003)
- `ImoraChart.tsx`: filtro de display que convierte valores ≥100 a null, corrige el JSON actual sin necesidad de regenerar datos
- `MercadoDineroChart.tsx`, `ActiveIndicatorChart.tsx`, `index.astro`: labels "TIIE Fondeo" → "TIIE 28d" en UI

### feat(ux): selector Todas/Ninguna SoFiPOs + rango de fechas en FX/Tasa/Inflación (2026-05-28)
- `SofiposEntidadesChart.tsx` (US-401): botones "Todas" / "Ninguna" para activar/desactivar todas las entidades; chips Okabe-Ito por entidad; botón activo resaltado con `--color-gold`
- `FXChart.tsx` (US-404): botones 1A / 3A / 5A / Máx encima del canvas; filtrado por fecha desde el último dato del array
- `TasaBanxicoChart.tsx` (US-404): mismo patrón; filtrado sobre puntos normalizados post `normalizeToIso`
- `InflacionChart.tsx` (US-404): mismo patrón; filtrado por campo `mes` (YYYY-MM)

### feat(G4): CitationBox + MetricTooltip con glosario (2026-05-28)
- `app/src/components/CitationBox.astro`: caja de cita con 3 pestañas (APA / BibTeX / RIS), botón Copiar con feedback visual "¡Copiado!" por 2s, dark theme con `--color-gold` para tab activa
- `app/src/data/glossary.ts`: glosario de 11 términos financieros (IMOR, IMORA, ICOR, ICAP, IFRS9, TIIE, Cetes, FIX, ROA, ROE, SoFiPO) con definición corta para tooltip y descripción completa
- `app/src/components/MetricTooltip.tsx`: componente React para envolver siglas con tooltip accesible (role="tooltip", aria-describedby), implementado con CSS puro, hover/focus activable por teclado
- `app/src/pages/metodologia.astro`: `CitationBox` montado en sección "Cita este recurso"
- `app/src/pages/instituciones.astro`: `MetricTooltip slug="imor"` en sección IMOR por banco/cartera

### fix(US-105) — IcorChart: escala eje Y y formato × (2026-05-28)
- `IcorChart.tsx`: reemplaza `max: yMax` dinámico por `suggestedMax: 3.5` — headroom sobre máximo histórico (~2.5×)
- `IcorChart.tsx`: tick del eje Y cambia de `1.2x` a `×1.2` (símbolo correcto)

### fix(US-106/US-104) — Investigación IMORA y TIIE (2026-05-28)
- US-106: `imora_total` en JSON está en escala 0–100 y `ImoraChart` no multiplica ×100; valores 2.35%–8.10% son plausibles — no hay bug
- US-104: `macro.astro` no monta charts de tasas; no hay duplicado en código estático
- Anomalía detectada: TIIE Fondeo (SF343410) en `sfm-data.json` muestra ~17–21% vs tasa objetivo ~6.5–9% — posible bug de pipeline en `update-data.yml` (serie equivocada o unidades incorrectas). Requiere investigación manual.

### feat: fusión Resumen + Mercado — KPIs clicables con gráfica dinámica (2026-05-28)
- `index.astro`: página Resumen absorbe todos los indicadores de Mercado — 9 KPI cards (FX, Tasa Banxico, Inflación, TIIE Fondeo, Cetes 28d, Spread TIIE-Cetes, Reservas, UDI, IMOR placeholder)
- `ActiveIndicatorChart.tsx`: componente React nuevo que escucha `sfm:kpi-select` y renderiza la gráfica del indicador seleccionado (FXChart, TasaBanxicoChart, InflacionChart, MercadoDineroChart, ReservasChart) con cabecera de sección dinámica
- `mercado.astro`: reemplazado por redirect 301 → `/`
- `TabBar.astro`, `BottomNav.astro`: tab "Mercado" eliminado — Resumen actualizado con subtítulo "FX · Tasas"
- `activeTab.ts`: tipo `TabId` sin `'mercado'`; `/mercado` mapea a `'resumen'`; `adjacentTab` actualizado
- `jsonld.ts`: catálogo actualizado — Resumen como dataset, Mercado de Dinero removido
- Click en KPI card activa la gráfica inline (capture-phase listener + `e.stopImmediatePropagation()` para no disparar ClientRouter); card activo se resalta con borde dorado

### ux(#85) — Rediseño menú de navegación (2026-05-27)
- `TabBar.astro` (desktop): labels con subtítulo descriptivo — "Riesgo Sistémico · Heatmap", "Mercado · TIIE · Cetes", "Crédito · IMOR · IMORA", "SoFiPOs · Financieras pop.", "Macro · PIB · IGAE"
- `BottomNav.astro` (mobile): solo label corto sin subtítulo para no saturar el espacio — "Riesgo", "Mercado", "Crédito", etc.

### fix(#80) — Preload CSS en GitHub Pages (2026-05-27)
- `app/astro.config.ts`: `cssCodeSplit: false` en `vite.build` — elimina el error "Unable to preload CSS for /_assets/X.css" al unificar en un solo bundle CSS (sin race condition entre hashes de build y SW caché)

### feat(#81) — Top 15 SoFiPOs por tamaño de cartera (2026-05-27)
- `sofipos.astro`: `SOFIPOS_PRIORITY` reordenada por cartera total real (CNBV sh_datos_27.csv, mar 2026) — encabeza CAJA INMACULADA (121B MXN), seguida de CAJA REAL PUEBLA (25B), REAL CAPITALIZA (13B), CAJA REAL CUAUHTÉMOC (12B), etc.
- SoFiPOs digitales (Nu México, KLAR, Stori) no reportan en el dataset CNBV Sector 27 Portafolio de Información

### feat(#82) — Orden por popularidad en tabla IMOR por banco (2026-05-27)
- `BancosTable.tsx`: nuevo `SortKey` tipo `'populares'` con lista `BANCOS_POPULARES` (G-7 primero: BBVA, Banamex, Banorte, Santander, HSBC, Scotiabank, Inbursa; luego fintechs y banca de hogares)
- Sort default cambiado de `imor_actual desc` a `populares`; click en cabecera "Banco" alterna entre popularidad y alfabético; icono ★ indica modo popularidad activo

### chore: infraestructura pre-escala (2026-05-27)
- `Layout.astro`: meta tags Highwire Press (`citation_title`, `citation_author` ×2, `citation_doi`, `citation_language`, `citation_abstract_html_url`) + Dublin Core (`DC.title`, `DC.creator`, `DC.identifier`, `DC.language`) — habilita indexación en Google Scholar, Mendeley, Zotero
- `Layout.astro`: snippet GoatCounter condicional en `PUBLIC_GOATCOUNTER_URL` — analytics sin cookies (activar configurando la variable de entorno)
- `update-data.yml`: ping Healthchecks.io condicional en secret `HEALTHCHECKS_URL` — monitoreo del pipeline de datos tras cada ejecución exitosa
- Gates G4 y G5 parcialmente completados en `docs/cutover.md`

### feat(#89) — Filtros por banco en IMORA e ICOR (2026-05-27)
- `ImoraChart.tsx`: toggle "Sistema / Por banco" con selector scrollable de los 62 bancos; crisis annotations solo en vista Sistema; valor actual en pill dorado al seleccionar banco
- `IcorChart.tsx`: mismo patrón de toggle/selector para ICOR, formateado en ×cobertura; crisis annotations solo en vista Sistema
- `credito.astro`: construye `bancosImoraArr` y `bancosIcorArr` y los pasa como prop `bancos` a ambos charts
- Cartera por banco no disponible para IMORA/ICOR (solo `_total` en CNBV Sector 40); IMOR ya tenía cartera + banco en `ImorSegPivotChart`; ROA/ROE e IFRS9 sin datos por banco

### fix(#83/#84) — Datos IMOR por banco y cartera (2026-05-27)
- `scripts/normalize-imor-por-banco.py`: corregido multiplicador ×100 para IMOR/IMORA (los valores raw del CSV están en escala 0–1); ICOR permanece ×1
- `scripts/normalize-imor-por-banco.py`: `CONCEPTS` migrado a `dict[str, tuple[str, float]]` con campo + multiplicador
- `raw-data/cnbv_indicadores.json`: regenerado con `imor_comercial` (1.48%), `imor_consumo` (2.27%), `imor_vivienda` (1.34%) — corrige #84 donde aparecían en 0
- `data/imor_por_banco.json`: generado por primera vez con 62 bancos × 304 periodos — habilita #83 (pivot por banco)
- `app/src/data/schema.ts`: `HistoricoBancoEntrySchema.imor_latest` actualizado a `{valor, fecha}` para coincidir con el output real del script
- `app/src/components/tables/BancosTable.tsx`: tipo `imor_latest` actualizado a `{valor, fecha} | null`
- `data/sfm-data.json`: regenerado (1.32 MB)

### En curso en branch `feat/app-redesign-pwa-v0.2.0-dev` (PR #1) — 31 commits

#### PASS 1 — Crédito tab + 4 charts (commit 7605892)
- 4 charts nuevos: `ImoraChart`, `IcorChart`, `RoaRoeChart` (dual-axis), `Ifrs9Chart` (stacked area)
- Crédito tab full content: editorial headline + 4 KPI cards (IMOR/IMORA/ICOR/ROA) + 4 secciones de chart + IFRS 9 KPI tiles
- Schema tightened: `KpiSnapshot`, `HistoricoCarteraSchema`, `Ifrs9UltimaSchema`, `CreditoSchema` y `Ifrs9Schema` ahora estrictos (no `looseObject`)

#### PASS 2 — SoFiPOs tab + IMOR-seg pivotable (commit 264d530)
- 3 charts SoFiPOs: `SofiposSegmentChart` (4-line cartera, Y fixed 0-45%), `SofiposEntidadesChart` (top 15 con paleta CVD-safe Okabe-Ito), `SofiposImoraRoaChart` (dual-axis)
- SoFiPOs tab full content: editorial headline + 4 KPIs (IMOR/Vivienda/IMORA/ROA) + 3 secciones
- `ImorSegPivotChart` — réplica del legacy `chart-imor-seg`: sector toggle BM↔SoFiPOs, view toggle Sistema/Por banco/Por entidad, selectores dinámicos (6 carteras BM, 4 SoFi, G-7 bancos, 45 entidades SoFiPOs)
- Schema tightened: `SofiposSchema`, `SofiposUltimaSchema`, `SofiposHistoricoEntidadSchema`, `SofiposEntidadSchema`, `HistoricoBancoEntrySchema`, `HistoricoBancoCarteraEntrySchema` (no más `looseObject`)

#### PASS 3 — HeroScore + Liquidez + Methodology (commit 443c529)
- `HeroScore.astro` server-rendered: serif headline 4.8rem color-coded por severidad agregada (Bajo/Contenido/Moderado/Elevado), 4 dimension pills (Crédito/Mercado/Macro/Liquidez) con semaforo dots, count de alertas activas
- Algoritmo de score compositional: thresholds por dimensión (IMOR: ≤3.5 verde / 3.5-4.5 amarillo / >4.5 rojo; Inflación: 2-4 verde / 4-6 amarillo / >6 rojo)
- Liquidez section en Resumen: depósitos crecimiento +7.2% + LCR mediana 331% (estimates pending CNBV pipeline)
- `/metodologia` route nueva con 4 collapsible details (umbrales por indicador, fuentes CNBV/Banxico/INEGI, cómo se actualizan datos, limitaciones)
- 6ta tab "Metodología" en TabBar + BottomNav + activeTab store

#### Cobertura del legacy `index.html` ahora ~95%
- ✅ 11/11 charts canvas migrados (FX, Tasa, Inflación, IMORA, ICOR, ROA+ROE dual, IFRS9 stacked, IMOR-seg pivot, SoFi cartera, SoFi top-15 entidades, SoFi IMORA+ROA dual)
- ✅ 5/5 secciones (Crédito, Mercado, Macro, SoFiPOs, Liquidez, Metodología)
- ✅ Hero score module
- ✅ Selectores dinámicos (sector toggle, view toggle, banco G-7, SoFi entidades, cartera segments)
- ✅ IFRS 9 KPI mini-tiles
- ❌ Solo PIB chart queda fuera (no PIB data en `sfm-data.json`)

### Por hacer (no bloqueado por migración Astro)
- DOI persistente vía Zenodo — requiere paso manual (ver `docs/citability.md`)
- Pipeline CNBV CSV automatizado (R12A IFRS9, SoFiPOs R11)
- Integración Banxico API para inflación subyacente (SP74625)
- Pipeline INEGI BIE para datos de PIB (último chart legacy faltante)
- Pipeline CNBV para datos reales de Liquidez (depósitos + LCR vs hardcoded estimates)
- M4 features citables: `<CitationBox>` UI, `<MetricTooltip>` glosario, JSON-LD `Dataset` por indicador, OG dinámico con Satori
- Reemplazar PWA icons placeholder (1×1 PNG) por íconos reales y activar `categories:pwa` en `lighthouserc.json`
- Modo Terminal toggle UI (store ya existe en `terminalMode.ts`)
- Cmd+K Tab focus trap (deferred del review de PR #1)
- i18n locale `en` removal o agregar contenido inglés
- Cache Playwright en CI (already added en PR #1) ✅

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
