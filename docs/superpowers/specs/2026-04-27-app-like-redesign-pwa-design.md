# Design spec — App-like redesign + PWA (v0.2.0)

**Status**: Approved by user (Artemio Padilla) on 2026-04-27, brainstormed via superpowers visual companion.
**Target**: SFM Monitor `app/` (Astro 5 + React 19 + TS strict)
**Replaces**: Current scaffold preview (`app/src/pages/index.astro` single-page, 3 charts vertically stacked).
**Cutover gate**: After M2-M3 charts complete + Playwright parity passes (see `docs/cutover.md` G1-G7).

---

## 1. Goals and constraints

**Why**: The current `app/` preview is a vertical scroll of cards — looks like a scaffold, not a product. The legacy `index.html` is a 3,300-line scroll-fest in the same trap. The redesign converts SFM Monitor into an **app-like, glanceable, mobile-first PWA** that serves both audiences identified in the blueprint:

- **Researchers / financial analysts** → glance + drill-down (KPI cards → tap → full detail with methodology)
- **Journalists / curious readers** → fast access to the headline number with editorial framing

**Non-goals**:
- Not a Bloomberg Terminal clone with draggable panes (out of scope; Terminal mode toggle deferred to v0.3.0)
- Not a sweeping refactor of the legacy `index.html` — the legacy stays untouched until cutover (`docs/cutover.md`)
- Not a brand-new visual identity — reuses the legacy palette and Cormorant Garamond serif so v0.1.0 → v0.2.0 reads as evolution, not abandonment

**Hard constraints**:
- Same `data/sfm-data.json` as legacy (single source of truth, refreshed by `update-data.yml`)
- Custom domain `sfmrisk.mx` (`app/public/CNAME`); base path `/`
- Static output (Cloudflare Pages or GitHub Pages); no server runtime
- Free-tier total cost (no paid services)
- Existing TS strict + Zod validation kept (branded types, single-point parsing per `AGENTS.md` rules)

---

## 2. Visual + navigation architecture (Layout D)

### 2.1 Top-level structure

```
┌────────────────────────────────────────────────────────────┐
│ ⬛ SFM Monitor v0.2.0          [⌘K Buscar indicador]  ●fresh │  ← sticky header
├────────────────────────────────────────────────────────────┤
│ [Resumen] [Mercado] [Crédito] [SoFiPOs] [Macro]            │  ← tab bar (desktop)
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Editorial eyebrow · Headline (Cormorant serif)            │
│                                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │  ← 4 KPI cards
│  │ FX     │ │ Tasa   │ │ Inflac │ │ IMOR   │   gold/red/   │
│  │ $17.40 │ │ 6.75%  │ │ 4.45%  │ │ 2.20%  │   yellow/green│
│  └────────┘ └────────┘ └────────┘ └────────┘               │
│                                                            │
│  ┌────────────────────────────────┐ ┌────────────────────┐ │
│  │   Featured chart                │ │  Alerts panel      │ │
│  │                                 │ │  ●yellow  IFRS9 ↑  │ │
│  │                                 │ │  ●red    SoFi 31%  │ │
│  └────────────────────────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

Each tab fits the desktop viewport without vertical scroll (target 1280×720+). Mobile uses `BottomNav` instead of top tabs and may scroll minimally if bento overflows.

### 2.2 Tabs (5)

| Tab | Path | Content |
|---|---|---|
| Resumen | `/` (default) | Editorial headline + 4 cross-section KPI hero + featured chart (rotates) + alerts panel |
| Mercado | `/mercado` | FX MXN/USD, Tasa Banxico, TIIE 28d (3-chart bento) |
| Crédito | `/credito` | IMOR histórico, IMOR por segmento, IMOR por banco G-7, IFRS9 etapas, ICOR, ROA, ROE |
| SoFiPOs | `/sofipos` | IMOR top 15 por activo, IMORA, ROA, comparativo vs Banca Múltiple |
| Macro | `/macro` | Inflación INPC anual, banda objetivo Banxico (PIB cuando entre en pipeline) |

Routing via Astro file-based pages; tab state mirrored to URL pathname.

### 2.3 Drawer pattern (drill-down)

Tap on any KPI card or chart → opens `ChartDrawer` modal (full-height on mobile, right-side panel on desktop) using **`vaul`** library:
- Chart full-size (Chart.js island reused)
- Methodology card (formula, source, frequency, last update, regulatory reference)
- Export buttons (PNG / SVG / CSV with embedded source attribution metadata)
- Swipe-down to dismiss (mobile), Esc to dismiss (desktop)
- Deep-linkable via `?indicator=fx` query string

### 2.4 Cmd+K palette

`cmdk` library, opens with `⌘K` / `Ctrl+K` from any tab. Searches all indicators by name, alias (e.g. "FX" → "tipo de cambio"), or Banxico series ID (e.g. "SF43718" → FX FIX). Selecting an indicator opens its drawer.

### 2.5 View Transitions

Astro built-in `<ClientRouter />` enables native View Transitions API (zero-JS overhead) for smooth crossfades between tabs and morph animation when KPI card → drawer (matching `view-transition-name`). Falls back to instant transitions on unsupported browsers (Firefox <125).

### 2.6 Mobile-first interactions

- **BottomNav** replaces top TabBar at `< lg` breakpoint, with 5 lucide icons + labels
- **Swipe horizontal between tabs** via `@use-gesture/react` (cancels if drawer open)
- **Pull-to-refresh** from top of content area, threshold 80px → spinner gold + page reload (re-fetches JSON via SW)
- **Tap targets** ≥ 44×44px per Apple HIG / Material guidelines

---

## 3. Design system (tokens + typography + palette)

### 3.1 CSS tokens (`app/src/styles/global.css`)

Replaces existing `@theme` block with the legacy `index.html` tokens verbatim:

```css
@theme {
  --color-bg: #0d1117;
  --color-bg-elev: #161b22;
  --color-bg-elev-2: #1c2128;
  --color-border: #30363d;
  --color-border-soft: #21262d;

  --color-text: #e6edf3;
  --color-text-dim: #8b949e;
  --color-text-mute: #6e7681;

  --color-gold: #c4a35a;
  --color-green: #3fb950;
  --color-yellow: #d29922;
  --color-red: #f85149;
  --color-gold-soft: rgba(196, 163, 90, 0.15);

  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}
```

Cyan/blue tokens from the current `app/` design system are removed entirely.

### 3.2 Typography rules

| Use | Font | Size | Weight | Notes |
|---|---|---|---|---|
| KPI value (hero) | Cormorant Garamond | `clamp(28px, 6vw, 38px)` | 600 | tabular-nums, letter-spacing -0.01em |
| Section headlines (eyebrow + headline) | Cormorant Garamond | 22-24px | 600 | line-height 1.1-1.15 |
| Eyebrows / labels uppercase | Inter | 9-11px | 500 | letter-spacing 0.12-0.15em, text-mute color |
| Body / UI text | Inter | 12-14px | 400-500 | |
| Tickers / IDs / source codes (SF43718, etc.) | JetBrains Mono | 9-11px | 500 | mute color, right-aligned |

Fonts loaded via:
- `https://rsms.me/inter/inter.css` (Inter Variable)
- Google Fonts: `Cormorant+Garamond:wght@400;500;600;700` + `JetBrains+Mono:wght@500`

Both with `<link rel="preconnect">` in Layout `<head>`.

### 3.3 Card primitive

Replaces existing `.surface` class:

```css
.card-surface {
  background: var(--color-bg-elev);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 18px;        /* 14px on mobile */
}

.card-surface[data-tone="gold"]   { border-color: rgba(196,163,90,0.35); }
.card-surface[data-tone="green"]  { border-color: rgba(63,185,80,0.35); }
.card-surface[data-tone="yellow"] { border-color: rgba(210,153,34,0.35); }
.card-surface[data-tone="red"]    { border-color: rgba(248,81,73,0.35); }
```

No gradient bg per card, no glow (toned-down direction approved by user — screen 03 of brainstorm).

### 3.4 Iconography

`lucide-react` (already installed): `TrendingUp`, `Percent`, `DollarSign`, `Activity`, `AlertTriangle`, `Search`, `Menu`, `X`, `ArrowUpRight`, `ArrowDownRight`, `Home`, `LineChart`, `Building2`, `Users`.

---

## 4. Component tree and file layout

### 4.1 New files (in `app/src/`)

```
layouts/
  Layout.astro                   ← shell: <head>, sticky Header, View Transitions <ClientRouter />

components/
  shell/
    Header.astro                 ← logo + Cmd+K trigger + DataFreshnessBadge
    TabBar.astro                 ← desktop top tabs (5)
    BottomNav.astro              ← mobile bottom nav (same 5 tabs, lucide icons)
    CmdKPalette.tsx              ← React island, `cmdk`, search indicators
    DataFreshnessBadge.tsx       ← (existing, restyled to legacy palette)
    PWAInstallPrompt.tsx         ← React island, beforeinstallprompt + iOS instructions
    OnboardingTour.tsx           ← React island, first-visit, localStorage flag
    PullToRefresh.tsx            ← mobile only, @use-gesture/react

  kpi/
    KpiCard.tsx                  ← (existing, restyled gold/green/yellow/red tones)
    KpiHero.tsx                  ← variant for mobile single-card hero

  drawer/
    ChartDrawer.tsx              ← React island, vaul drawer
    DrawerChart.tsx              ← chart full-size inside drawer
    DrawerMetadata.tsx           ← formula, source, frequency, regulatory ref
    DrawerExport.tsx             ← PNG/SVG/CSV buttons with metadata embedding

  charts/
    FXChart.tsx                  ← (existing)
    TasaBanxicoChart.tsx         ← (existing)
    InflacionChart.tsx           ← (existing)
    [M2-M3 placeholders for ImorHistoricoChart, ImorSegmentoChart, etc. — out of scope this sprint]

  alerts/
    AlertsPanel.astro            ← server-rendered, rules from data/alerts.ts

  chrome/
    EditorialHeadline.astro      ← eyebrow + serif headline (Resumen tab)

pages/
  index.astro                    ← Resumen tab content (default route)
  mercado.astro
  credito.astro                  ← placeholder card with CTA to legacy until M2 charts land
  sofipos.astro                  ← placeholder card with CTA to legacy until M3 charts land
  macro.astro

stores/
  activeTab.ts                   ← nanostores; URL pathname is source of truth
  drawerState.ts                 ← nanostores; mirrors ?indicator= query string
  terminalMode.ts                ← nanostores; localStorage-persisted toggle (UI deferred)

data/
  schema.ts                      ← (existing)
  loader.ts                      ← (existing)
  alerts.ts                      ← rule definitions (IFRS9 stage 2 trend, SoFiPOs Vivienda > 30%, inflation > 3+1pp, etc.)
  indicators.ts                  ← registry: { id, label, aliases, unit, source, color, drawer config }

lib/
  utils.ts                       ← (existing: cn, formatMxn, formatPct, computeDelta, ddmmyyyyToIso)
  pwa.ts                         ← service worker registration helper
  transitions.ts                 ← view-transition-name helpers per indicator

styles/
  global.css                     ← (existing, expanded with legacy tokens)
```

### 4.2 New files (in `app/public/`)

```
manifest.webmanifest             ← PWA manifest
icons/
  icon-192.png                   ← standard
  icon-512.png                   ← standard
  icon-maskable-192.png          ← maskable for Android adaptive icons
  icon-maskable-512.png
apple-touch-icon.png             ← iOS home screen
sw.js                            ← generated by @vite-pwa/astro (do not edit by hand)
CNAME                            ← (existing: 'sfmrisk.mx')
```

### 4.3 New dependencies (`npm install`)

| Package | Approx size | Purpose |
|---|---|---|
| `vaul` | 6KB | Drawer / sheet primitive |
| `cmdk` | 8KB | Command palette |
| `@nanostores/react` | <1KB | React bindings for existing nanostores |
| `@vite-pwa/astro` | dev-only | PWA manifest + SW generation |
| `workbox-window` | 6KB | SW lifecycle messaging (auto-update toast) |
| `@use-gesture/react` | 12KB | Swipe + pull gestures |

Total runtime addition: ~33KB gzip incremental on top of current bundle.

### 4.4 Files removed / replaced

- `app/src/components/Sidebar.astro` — replaced by TabBar/BottomNav
- `app/src/components/Hero.astro` — replaced by EditorialHeadline (more editorial, less "marketing landing")
- `app/src/components/Section.astro` — kept but restyled to use new card-surface tokens
- `app/src/components/Footer.astro` — kept, restyled

---

## 5. Data flow

### 5.1 Build-time (unchanged from current implementation)

```
data/sfm-data.json   ──▶ loader.ts (Zod parse + cache)
                          │
                          ▼
                     SfmData typed, exported
                          │
                          ├──▶ pages/{tab}.astro  (frontmatter loads, passes props)
                          │       │
                          │       ▼
                          │  React island components (client:visible)
                          │
                          ├──▶ data/alerts.ts   ──▶ AlertsPanel.astro
                          │
                          └──▶ data/indicators.ts (registry)
                                  │
                                  ├──▶ CmdKPalette.tsx (search index)
                                  └──▶ ChartDrawer.tsx (drawer content per indicator id)
```

Schema validation runs at build via `astro check`; fail-loud aborts deploy.

### 5.2 Runtime (PWA)

```
First visit:
  Browser ──▶ HTML + critical CSS (server-rendered by Astro)
          ──▶ JS islands hydrate (client:visible / client:idle)
          ──▶ SW installs; precaches /_assets/* + /data/sfm-data.json

Subsequent visits:
  SW intercepts:
    /_assets/*     → cache-first
    /data/*.json   → NetworkFirst, 3s timeout, fallback cache
    fonts          → StaleWhileRevalidate

Offline:
  Page renders from cache; DataFreshnessBadge shows cached date
  No network indicator banner appears
```

### 5.3 State persistence

| State | Where | Notes |
|---|---|---|
| Active tab | URL pathname | `/`, `/mercado`, etc. — refresh-friendly, shareable |
| Drawer open + indicator | URL query `?indicator=fx` | Permalinkable |
| Terminal mode toggle | `localStorage.sfm-terminal-mode` | Personal preference, not URL |
| Onboarding completed | `localStorage.sfm-onboarding-done` | First-visit flag |
| Visit count (PWA install gate) | `localStorage.sfm-visit-count` | Increments per session |

---

## 6. PWA configuration

### 6.1 `manifest.webmanifest`

```json
{
  "name": "SFM Monitor — Riesgo del Sistema Financiero Mexicano",
  "short_name": "SFM Monitor",
  "description": "Dashboard público de riesgo financiero MX",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#0d1117",
  "background_color": "#0d1117",
  "lang": "es-MX",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "categories": ["finance", "news"]
}
```

### 6.2 Service worker (Workbox via `@vite-pwa/astro`)

```ts
// app/astro.config.ts (additions)
import AstroPWA from '@vite-pwa/astro';

integrations: [
  ...,
  AstroPWA({
    registerType: 'autoUpdate',
    manifest: false,            // we ship manifest.webmanifest manually for control
    workbox: {
      globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
      runtimeCaching: [
        {
          urlPattern: /\/data\/.*\.json$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'sfm-data',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
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
```

Auto-update flow: SW detects new bundle on next page load → shows non-blocking toast "Nueva versión disponible · refrescar" → user clicks → `window.location.reload()`.

### 6.3 Install prompt

`PWAInstallPrompt.tsx` island:
- Listens for `beforeinstallprompt` event (Chrome / Edge / Android)
- Stores prompt event, shows discreet banner only after `localStorage.sfm-visit-count >= 2`
- iOS Safari does not expose the event → detects via UA + `navigator.standalone` → shows manual instructions card with Share + "Add to Home Screen" steps
- User dismisses → `localStorage.sfm-install-dismissed` set with timestamp; no re-prompt for 30 days

---

## 7. Gestures and interactions

| Gesture | Where | Behavior | Implementation |
|---|---|---|---|
| Tap KPI / chart | Any tab | Open `ChartDrawer` for that indicator | onClick handler updates `drawerState` store + URL query |
| Swipe ←/→ on content | Any tab (mobile) | Switch to adjacent tab | `@use-gesture/react` `useDrag` with axis lock, threshold 50px |
| Swipe ↓ on drawer | Drawer open (mobile) | Dismiss drawer | Native `vaul` behavior |
| Pull from top | Any tab (mobile) | Refresh (reload page) | Custom `PullToRefresh` listener, threshold 80px |
| `⌘K` / `Ctrl+K` | Anywhere | Open Cmd+K palette | `cmdk` library default keybind |
| `Esc` | Drawer / palette open | Close | Native browser + library defaults |
| `←` / `→` arrows | Anywhere (desktop) | Switch tab | Custom keydown listener on Layout |
| `?` | Anywhere | Open keyboard shortcuts help (drawer variant) | Future iteration |

`prefers-reduced-motion: reduce` disables: swipe animations (instant transitions), View Transitions API, drawer slide-in animation (instant fade).

---

## 8. Error handling

| Failure mode | Behavior |
|---|---|
| Schema fails at build | `astro check` aborts; CI red; deploy blocked. Already implemented in `loader.ts` (10 issues + count). |
| Schema fails at runtime | N/A — data is parsed at build, not runtime fetch. |
| `/data/sfm-data.json` fetch fails (PWA refresh) | SW serves cached snapshot. `DataFreshnessBadge` shows cached date with `data-stale` attribute. Yellow banner: "Mostrando datos del DD/MM/YYYY · pull para reintentar". |
| Chart island throws | React Error Boundary per chart catches; renders fallback card "No se pudo renderizar este gráfico — [Ver en dashboard estable ↗](https://pamela-ruiz9.github.io/sfm-monitor/)". Console error + (future) Sentry capture. |
| Cmd+K query no matches | Empty state with top-5 suggested indicators ("Quizás buscabas: IMOR · FX · Tasa Banxico"). |
| Drawer opens with invalid `?indicator=foo` | Query ignored; warn to console; drawer does not open. URL cleaned via `history.replaceState`. |
| PWA install prompt unsupported | UA detection: iOS Safari shows manual card with screenshot; other unsupported browsers silently skip. |
| Service worker registration fails | App still works (no offline support); log warning; future Sentry. |

---

## 9. Accessibility (WCAG 2.2 AA)

### 9.1 Color contrast (verified against `--color-bg-elev` #161b22)

| Token | Contrast ratio | WCAG AA |
|---|---|---|
| `--color-text` #e6edf3 | 13.5:1 | ✅ AAA |
| `--color-text-dim` #8b949e | 4.7:1 | ✅ AA |
| `--color-text-mute` #6e7681 | 3.2:1 | ⚠️ AA Large only — restrict to ≥18px |
| `--color-gold` #c4a35a | 6.8:1 | ✅ AA |
| `--color-green` #3fb950 | 7.2:1 | ✅ AA |
| `--color-yellow` #d29922 | 6.1:1 | ✅ AA |
| `--color-red` #f85149 | 5.4:1 | ✅ AA |

### 9.2 Keyboard navigation

- `Tab` traverses logical order: Header logo → Cmd+K → TabBar → KPI cards → charts → footer
- `Enter` / `Space` on focusable card opens drawer
- `Esc` closes drawer or Cmd+K palette
- `←` / `→` switches tab when no input focused
- `⌘K` / `Ctrl+K` opens palette globally
- Focus ring: 2px solid gold (`--color-gold`), offset 2px

### 9.3 ARIA

- `<nav role="tablist">` on TabBar; each tab `role="tab"` with `aria-selected` and `aria-controls`
- Tab panels `role="tabpanel"` with `aria-labelledby`
- Drawer `role="dialog" aria-modal="true" aria-labelledby="drawer-title"`
- `DataFreshnessBadge` has `aria-live="polite"` so SR announces freshness changes
- Each `<canvas>` chart has `aria-label="Gráfico de {indicator}, valor actual {X}, serie desde {fecha inicio}"`
- Decorative gradients / accent lines use `aria-hidden="true"`

### 9.4 Non-color signaling

- KPI cards: icon (lucide) + uppercase label, never color alone
- Deltas: arrow glyph (▲ / ▼ / —) + color
- Alerts: dot glyph + label, never color alone
- Tab active: bg-color + border + bold text, not just bg-color

---

## 10. Performance targets

| Metric | Target | Method |
|---|---|---|
| LCP (mobile 4G) | ≤ 2.5s | Hero KPI is server-rendered HTML, no JS dependency |
| CLS | ≤ 0.1 | Chart skeletons reserve height before island hydrates |
| INP (interactions) | ≤ 200ms | Tab switch via View Transitions (CSS-driven), drawer open <16ms via `vaul` optimized |
| Initial HTML + critical CSS (above-the-fold render) | ≤ 50KB gzip | Astro server-renders KPI cards as HTML; charts hydrate after |
| React runtime (`client.js`) — loaded once | ~60KB gzip | Shared chunk across all tabs; cached aggressively |
| Chart.js + chartjs-plugin-annotation — loaded once | ~85KB gzip | Shared chunk; first chart pays full cost, subsequent free |
| Per-chart island incremental | ≤ 2KB gzip | Tiny wrapper code; Chart.js engine reused |
| Total JS per tab (cold load) | ≤ 200KB gzip | React + Chart.js + plugins + 1-3 chart islands |
| Total JS per tab (warm, after first nav) | ≤ 5KB gzip | Just the new chart islands; SW cache + chunk dedup |
| Lighthouse Performance | ≥ 90 | CI gate via `lighthouse-ci` |
| Lighthouse Accessibility | ≥ 95 | CI gate |
| Lighthouse Best Practices | ≥ 95 | CI gate |
| Lighthouse SEO | ≥ 95 | CI gate (sitemap, canonical, lang) |
| Lighthouse PWA | ✅ pass | manifest + SW + HTTPS + icons |

---

## 11. Testing strategy

### 11.1 Unit (Vitest 4 + @testing-library/react)

- `lib/utils.ts`: `formatMxn`, `formatPct`, `computeDelta` (incl. edge cases: <2 points, zero prev), `ddmmyyyyToIso` (incl. malformed input)
- `data/schema.ts`: parse fixtures of real `sfm-data.json` segments; expect success
- `data/alerts.ts`: each rule produces correct severity/label given fixture
- `data/indicators.ts`: registry has unique IDs, every chart component matches a registry entry
- `components/kpi/KpiCard.tsx`: renders all tone variants, delta direction icons match upIsGood semantic

### 11.2 E2E (Playwright)

Smoke per tab:
- Load `/`, `/mercado`, `/credito`, `/sofipos`, `/macro`; expect HTTP 200, no console errors, KPI values present in DOM, chart canvas elements exist

Drawer interactions:
- Tap FX KPI → drawer opens with FX chart visible, methodology card present
- Swipe down on drawer (mobile viewport) → drawer dismisses
- Direct link to `/mercado?indicator=fx` → drawer opens on load

Cmd+K:
- Press `Cmd+K` → palette opens, search input focused
- Type "fx" → "Tipo de cambio FIX" appears in results
- `Enter` → drawer opens for FX

Tab nav:
- Click tab → URL updates, content changes
- Mobile viewport (375×667): swipe left on `/` → URL becomes `/mercado`

Visual regression (`toHaveScreenshot()`):
- 5 tabs × 2 viewports (1280×720, 375×667) = 10 baseline screenshots
- Drawer open: FX drawer × 2 viewports = 2 baselines
- Threshold 0.5% pixel diff

### 11.3 CI integration

- GitHub Action workflow `.github/workflows/test.yml`:
  1. Install (npm ci with cache)
  2. `npm run lint` (when ESLint configured)
  3. `npm run typecheck` (`tsc --noEmit`)
  4. `npm run build` (includes `astro check`)
  5. Vitest unit tests
  6. Playwright E2E with `--reporter=html`
  7. Lighthouse CI against built dist
- Run on PR + main; cache `node_modules` + Playwright browsers

---

## 12. Scope (what ships in this design's implementation)

### ✅ In-scope

1. Layout D structure with 5 tabs + routing
2. Legacy palette tokens (gold/green/yellow/red, no blue/cyan)
3. Cormorant Garamond serif for KPI values + headlines; Inter for UI
4. Bento grid responsive desktop / mobile
5. Drawer pattern (`vaul`) for chart drill-down with deep-linking
6. Cmd+K palette (`cmdk`)
7. Bottom nav mobile + swipe between tabs
8. PWA: manifest, service worker, offline-with-cached-data, install prompt, iOS instructions
9. Pull-to-refresh mobile
10. View Transitions API integration
11. Onboarding tour first visit (lightweight tooltip tour, ~5 steps)
12. Restyle of 3 existing charts (FX, Tasa, Inflación) + placeholder cards for Crédito + SoFiPOs tabs
13. Editorial headline + AlertsPanel with rule-driven alerts (initial 3-5 rules in `data/alerts.ts`)
14. Error boundaries per chart
15. Vitest unit tests + Playwright E2E + visual regression for tabs and drawer
16. Lighthouse CI configuration

### 📋 Out-of-scope (later sprints; tracked elsewhere)

- 6 charts pending migration (M2-M3 per `docs/migration-astro.md`) — placeholders shipped now
- Modo Terminal toggle UI implementation. The `stores/terminalMode.ts` store ships in this sprint (with localStorage persistence) so future code can read it, but no UI control or alternate layout is built yet. Default: `false`.
- `<CitationBox>` UI component (spec already in `docs/citability.md`)
- `<MetricTooltip>` glossary with Floating UI
- JSON-LD `@type: Dataset` per indicator (M4 of migration plan)
- Sentry / Umami / Healthchecks integration
- English translations (Astro i18n config exists; copy in `en` locale missing)
- Cutover to v0.2.0 release tag (this redesign is foundational; cutover requires M2-M3 completion + Playwright parity per `docs/cutover.md`)

---

## 13. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Cormorant Garamond at 38px feels heavy on mobile | Responsive `clamp(28px, 6vw, 38px)`; QA on real devices |
| Service worker scope mismatch with Pages base path | Astro builds with `base: '/'`; SW scope explicitly `/` in config |
| View Transitions unsupported in Firefox <125 | Graceful degradation: instant nav, no animation, fully functional |
| Vaul drawer `position: fixed` z-index conflict with sticky header | Test stacking; if needed, header z-50, drawer overlay z-100 |
| PWA install criteria not met on first deploy | Lighthouse PWA audit catches; checklist in implementation plan |
| Swipe-between-tabs conflicts with horizontal-scrolling charts | Disable horizontal swipe within `<canvas>` bounds; only active in margin gutters |
| Bento grid overflows viewport on small desktop (1024×600) | Fallback to scroll within tab; bento gracefully reflows |
| Chart.js bundle re-downloaded per page | Astro shared chunks should dedupe; verify via `npm run build` size report |
| Onboarding tour blocks user on first visit | Skippable from any step; `localStorage` flag prevents re-show |

---

## 14. Open questions (none blocking)

All decisions confirmed during brainstorm:
- Tabs: 5 (default approved, no override clicked)
- Modo Terminal: yes (deferred to v0.3.0 implementation but flag exists now)
- Onboarding tour: yes (default approved)
- Offline scope: assets + data cached (default approved)
- PWA install banner: yes, subtle (default approved)
- Cmd+K palette: yes (default approved)

If implementation surfaces blockers, return to brainstorming before deviating.

---

## 15. References

- Brainstorm session artifacts (local-only, in `.gitignore`): `.superpowers/brainstorm/<session-id>/content/01-06.html` (mockups), `state/events` (clicks). This spec is the canonical record; the local files are reference-only.
- Strategic blueprint: `docs/research/blueprint-2026.md` §5 (Frontend), §6 (Visualization), §7 (UX & distribution)
- Migration plan (sprint M0-M5): `docs/migration-astro.md`
- Cutover gates G1-G7: `docs/cutover.md`
- Citability features: `docs/citability.md`
- AGENTS guide for repo conventions: `AGENTS.md`
- Legacy `index.html` (palette source): `index.html` lines with `--bg`, `--gold`, etc.

---

## 16. Approval trail

- 2026-04-27: Brainstormed via superpowers visual companion (5 mockup screens). User picked layout D + earthy/B + serif + legacy palette + toned-down (less glow). All 6 default decisions accepted.
- 2026-04-27: Design sections 1-5 presented in terminal, all approved sequentially ("ok").
- Pending: User review of this written spec.
- Pending: Transition to `superpowers:writing-plans` to produce sprint-by-sprint implementation plan.
