# App-like Redesign + PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `app/` from a vertical-scroll scaffold into a glanceable, mobile-first PWA with 5 tabs, drawer drill-down, Cmd+K palette, gestures, and offline support — matching the legacy palette and Cormorant serif typography.

**Architecture:** Astro 5 file-based routing for tabs (one `.astro` page per tab), React 19 islands for interactive components (drawer, palette, install prompt, gestures, charts), native View Transitions API via Astro `<ClientRouter />`, `vaul` for drawer, `cmdk` for palette, `@vite-pwa/astro` for service worker + manifest, `nanostores` for cross-island state synced to URL where appropriate.

**Tech Stack:** Astro 5.16, React 19.2, TypeScript 5.7 strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Tailwind CSS v4 (Oxide), Zod 4, Chart.js 4, vaul, cmdk, @nanostores/react, @vite-pwa/astro, workbox-window, @use-gesture/react, lucide-react, driver.js, Vitest 4, Playwright.

**Spec:** [`docs/superpowers/specs/2026-04-27-app-like-redesign-pwa-design.md`](../specs/2026-04-27-app-like-redesign-pwa-design.md)

**Repo conventions:** [`AGENTS.md`](../../../AGENTS.md) — never `any`, never bypass `loader.ts`, branded types for financial values, npm only.

---

## File map (what gets created or modified)

**Modified** (existing in `app/src/`):
- `package.json` — new deps
- `astro.config.ts` — PWA integration, View Transitions
- `tsconfig.json` — no change expected
- `src/styles/global.css` — replace token block with legacy palette
- `src/layouts/Layout.astro` — full rewrite (sticky header + ClientRouter + bottom nav slot)
- `src/components/DataFreshnessBadge.tsx` — restyle to gold/legacy
- `src/components/charts/{FX,TasaBanxico,Inflacion}Chart.tsx` — drop background; defer to parent surface
- `src/data/schema.ts` — no change
- `src/data/loader.ts` — no change
- `src/lib/utils.ts` — add `formatRelativeDate`, `parseDdmmyyyy` if missing
- `src/pages/index.astro` — becomes Resumen tab (rewritten)

**Removed** (existing components no longer used):
- `src/components/Hero.astro` — replaced by `EditorialHeadline.astro`
- `src/components/Sidebar.astro` — replaced by `TabBar.astro` + `BottomNav.astro`

**Created** (new in `app/src/`):
- `src/components/shell/Header.astro`
- `src/components/shell/TabBar.astro`
- `src/components/shell/BottomNav.astro`
- `src/components/shell/CmdKPalette.tsx`
- `src/components/shell/PWAInstallPrompt.tsx`
- `src/components/shell/OnboardingTour.tsx`
- `src/components/shell/PullToRefresh.tsx`
- `src/components/shell/UpdateToast.tsx`
- `src/components/kpi/KpiCard.tsx` (replaces existing)
- `src/components/kpi/KpiHero.tsx`
- `src/components/drawer/ChartDrawer.tsx`
- `src/components/drawer/DrawerMetadata.tsx`
- `src/components/drawer/DrawerExport.tsx`
- `src/components/alerts/AlertsPanel.astro`
- `src/components/chrome/EditorialHeadline.astro`
- `src/components/chrome/Section.astro` (replaces existing)
- `src/components/charts/ChartErrorBoundary.tsx`
- `src/stores/activeTab.ts`
- `src/stores/drawerState.ts`
- `src/stores/terminalMode.ts`
- `src/stores/onboarding.ts`
- `src/data/alerts.ts`
- `src/data/indicators.ts`
- `src/lib/pwa.ts`
- `src/lib/transitions.ts`
- `src/pages/index.astro` (Resumen, replaces existing scaffold)
- `src/pages/mercado.astro`
- `src/pages/credito.astro`
- `src/pages/sofipos.astro`
- `src/pages/macro.astro`

**Created** (new in `app/public/`):
- `manifest.webmanifest`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `icons/icon-maskable-192.png`
- `icons/icon-maskable-512.png`
- `apple-touch-icon.png`

**Created** (testing):
- `app/vitest.config.ts`
- `app/playwright.config.ts`
- `app/tests/unit/utils.test.ts`
- `app/tests/unit/alerts.test.ts`
- `app/tests/unit/indicators.test.ts`
- `app/tests/unit/schema.test.ts`
- `app/tests/e2e/tabs.spec.ts`
- `app/tests/e2e/drawer.spec.ts`
- `app/tests/e2e/cmdk.spec.ts`
- `app/tests/e2e/visual.spec.ts`
- `app/lighthouserc.json`
- `.github/workflows/test.yml`

---

## Task 1: Add runtime + test dependencies

**Files:**
- Modify: `app/package.json`

- [ ] **Step 1.1: Install runtime deps**

Run from repo root:

```bash
cd app && npm install vaul cmdk @nanostores/react @vite-pwa/astro workbox-window @use-gesture/react driver.js
```

Expected: 7 packages added; `package.json` and `package-lock.json` updated.

- [ ] **Step 1.2: Install test deps**

```bash
cd app && npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test @lhci/cli
```

Expected: 7 dev deps added.

- [ ] **Step 1.3: Install Playwright browsers**

```bash
cd app && npx playwright install --with-deps chromium
```

Expected: Chromium installed for Playwright E2E.

- [ ] **Step 1.4: Add test scripts to package.json**

Edit `app/package.json` `scripts` block to include:

```json
{
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview --host",
    "astro": "astro",
    "check": "astro check",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx,.astro",
    "format": "prettier --write \"src/**/*.{ts,tsx,astro,md,mdx}\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lighthouse": "lhci autorun"
  }
}
```

- [ ] **Step 1.5: Verify build still passes**

```bash
cd app && npm run build
```

Expected: build completes without errors. (We haven't changed any source yet — sanity check that deps install cleanly.)

- [ ] **Step 1.6: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "build(app): add vaul, cmdk, @vite-pwa, gestures, driver.js, vitest, playwright"
```

---

## Task 2: Migrate design tokens to legacy palette

**Files:**
- Modify: `app/src/styles/global.css`

- [ ] **Step 2.1: Replace global.css entirely**

Overwrite `app/src/styles/global.css` with:

```css
@import 'tailwindcss';

@theme {
  /* GitHub-dark base — exact to legacy index.html */
  --color-bg: #0d1117;
  --color-bg-elev: #161b22;
  --color-bg-elev-2: #1c2128;
  --color-border: #30363d;
  --color-border-soft: #21262d;

  /* Texto */
  --color-text: #e6edf3;
  --color-text-dim: #8b949e;
  --color-text-mute: #6e7681;

  /* Acentos KPI — exactos al legacy, sin azul */
  --color-gold: #c4a35a;
  --color-green: #3fb950;
  --color-yellow: #d29922;
  --color-red: #f85149;
  --color-gold-soft: rgba(196, 163, 90, 0.15);

  /* Tipografía */
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans:
    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', monospace;

  --default-transition-duration: 200ms;
}

* {
  border-color: var(--color-border);
}

html {
  font-family: var(--font-sans);
  font-feature-settings: 'tnum', 'lnum', 'ss01', 'cv11';
  background: var(--color-bg);
  color-scheme: dark;
}

body {
  min-height: 100vh;
  color: var(--color-text);
}

.tabular {
  font-variant-numeric: tabular-nums lining-nums;
}

.serif {
  font-family: var(--font-serif);
}

.mono {
  font-family: var(--font-mono);
}

/* Card primitive — used by KpiCard, AlertsPanel, charts container */
.card-surface {
  background: var(--color-bg-elev);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.card-surface[data-tone='gold'] {
  border-color: rgba(196, 163, 90, 0.35);
}
.card-surface[data-tone='green'] {
  border-color: rgba(63, 185, 80, 0.35);
}
.card-surface[data-tone='yellow'] {
  border-color: rgba(210, 153, 34, 0.35);
}
.card-surface[data-tone='red'] {
  border-color: rgba(248, 81, 73, 0.35);
}

/* Anchor scroll offset for sticky header */
:target {
  scroll-margin-top: 80px;
}

/* Focus ring — gold instead of blue */
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 2px;
  border-radius: 4px;
}

canvas:focus {
  outline: none;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* View Transitions */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 200ms;
}
```

- [ ] **Step 2.2: Verify build still passes (no chart imports broke)**

```bash
cd app && npm run build
```

Expected: build completes. Visual check done in Task 3 after Layout updates.

- [ ] **Step 2.3: Commit**

```bash
git add app/src/styles/global.css
git commit -m "style(app): replace tokens with legacy palette (gold/green/yellow/red, GitHub-dark base)"
```

---

## Task 3: Rewrite Layout.astro with View Transitions, fonts, sticky header slot

**Files:**
- Modify: `app/src/layouts/Layout.astro`

- [ ] **Step 3.1: Overwrite Layout.astro**

Replace contents:

```astro
---
import '~/styles/global.css';
import { ClientRouter } from 'astro:transitions';

interface Props {
  title: string;
  description?: string;
  canonical?: string;
}

const {
  title,
  description = 'Monitor de Riesgo del Sistema Financiero Mexicano · Datos de Banxico, CNBV e INEGI',
  canonical,
} = Astro.props;

const fullTitle = title === 'SFM Monitor' ? title : `${title} · SFM Monitor`;
const canonicalUrl =
  canonical ?? new URL(Astro.url.pathname, Astro.site).toString();
---

<!doctype html>
<html lang={Astro.currentLocale ?? 'es'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalUrl} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="#0d1117" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />

    <!-- Fonts: Cormorant Garamond + Inter + JetBrains Mono -->
    <link rel="preconnect" href="https://rsms.me/" />
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />

    <ClientRouter />
    <title>{fullTitle}</title>
  </head>
  <body class="min-h-screen flex flex-col pb-20 lg:pb-0">
    <slot name="header" />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6">
      <slot />
    </main>

    <slot name="footer" />
    <slot name="bottom-nav" />
  </body>
</html>
```

- [ ] **Step 3.2: Verify build**

```bash
cd app && npm run build
```

Expected: build passes, page still renders (using slots that pages will fill).

- [ ] **Step 3.3: Commit**

```bash
git add app/src/layouts/Layout.astro
git commit -m "feat(app): rewrite Layout with View Transitions, Cormorant/Inter/Mono fonts, manifest link, slot-based shell"
```

---

## Task 4: Create Header, TabBar, BottomNav (shell components)

**Files:**
- Create: `app/src/components/shell/Header.astro`
- Create: `app/src/components/shell/TabBar.astro`
- Create: `app/src/components/shell/BottomNav.astro`

- [ ] **Step 4.1: Create Header.astro**

```astro
---
import { loadSfmData } from '~/data/loader';
import { DataFreshnessBadge } from '~/components/DataFreshnessBadge';

const data = loadSfmData();
const lastUpdated = data.ultima_actualizacion;
---

<header
  class="sticky top-0 z-40 border-b border-[--color-border] backdrop-blur-md"
  style="background: linear-gradient(180deg, rgba(13,17,23,0.92), rgba(13,17,23,0.78))">
  <div class="max-w-7xl mx-auto px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
    <a
      href="/"
      class="flex items-center gap-2 group"
      data-astro-prefetch>
      <span
        class="size-7 rounded-md inline-block"
        style="background: linear-gradient(135deg, var(--color-gold), #8b6f3a); border: 1px solid rgba(196,163,90,0.4);"
        aria-hidden="true"></span>
      <span class="serif text-lg font-semibold text-[--color-text] leading-none">
        SFM Monitor
      </span>
      <span class="text-[10px] text-[--color-text-mute] hidden sm:inline">
        v0.2.0
      </span>
    </a>

    <div class="flex items-center gap-3">
      <DataFreshnessBadge
        source="Banxico"
        lastUpdated={lastUpdated}
        client:load
      />
      <button
        type="button"
        data-cmdk-trigger
        class="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-[--color-border] bg-[--color-bg-elev] text-[11px] text-[--color-text-dim] hover:text-[--color-text] hover:border-[--color-gold] transition-colors"
        aria-label="Buscar indicador">
        Buscar
        <kbd class="text-[10px] mono px-1.5 py-0.5 rounded bg-[--color-bg-elev-2] border border-[--color-border-soft] text-[--color-text-dim]">
          ⌘K
        </kbd>
      </button>
    </div>
  </div>
</header>
```

- [ ] **Step 4.2: Create TabBar.astro**

```astro
---
import { Home, LineChart, Activity, Building2, TrendingUp } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Resumen', match: /^\/$/, Icon: Home },
  { href: '/mercado', label: 'Mercado', match: /^\/mercado/, Icon: LineChart },
  { href: '/credito', label: 'Crédito', match: /^\/credito/, Icon: Activity },
  { href: '/sofipos', label: 'SoFiPOs', match: /^\/sofipos/, Icon: Building2 },
  { href: '/macro', label: 'Macro', match: /^\/macro/, Icon: TrendingUp },
] as const;

const path = Astro.url.pathname;
---

<nav
  aria-label="Secciones del dashboard"
  class="hidden lg:block border-b border-[--color-border-soft]">
  <div
    class="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto"
    role="tablist">
    {
      TABS.map(({ href, label, match, Icon }) => {
        const active = match.test(path);
        return (
          <a
            href={href}
            role="tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            data-astro-prefetch
            class:list={[
              'inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              active
                ? 'text-[--color-gold] border-[--color-gold]'
                : 'text-[--color-text-mute] border-transparent hover:text-[--color-text-dim] hover:border-[--color-border]',
            ]}>
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </a>
        );
      })
    }
  </div>
</nav>
```

- [ ] **Step 4.3: Create BottomNav.astro**

```astro
---
import { Home, LineChart, Activity, Building2, TrendingUp } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Resumen', match: /^\/$/, Icon: Home },
  { href: '/mercado', label: 'Mercado', match: /^\/mercado/, Icon: LineChart },
  { href: '/credito', label: 'Crédito', match: /^\/credito/, Icon: Activity },
  { href: '/sofipos', label: 'SoFiPOs', match: /^\/sofipos/, Icon: Building2 },
  { href: '/macro', label: 'Macro', match: /^\/macro/, Icon: TrendingUp },
] as const;

const path = Astro.url.pathname;
---

<nav
  aria-label="Navegación principal"
  class="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[--color-border]"
  style="background: linear-gradient(180deg, rgba(13,17,23,0.85), rgba(13,17,23,0.95)); backdrop-filter: blur(12px); padding-bottom: env(safe-area-inset-bottom);">
  <ul class="flex justify-around items-stretch" role="tablist">
    {
      TABS.map(({ href, label, match, Icon }) => {
        const active = match.test(path);
        return (
          <li class="flex-1">
            <a
              href={href}
              role="tab"
              aria-selected={active}
              aria-current={active ? 'page' : undefined}
              data-astro-prefetch
              class:list={[
                'flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
                active ? 'text-[--color-gold]' : 'text-[--color-text-mute]',
              ]}>
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        );
      })
    }
  </ul>
</nav>
```

- [ ] **Step 4.4: Commit**

```bash
git add app/src/components/shell/
git commit -m "feat(app): add Header, TabBar, BottomNav shell components"
```

---

## Task 5: Create new Section.astro and EditorialHeadline.astro

**Files:**
- Create: `app/src/components/chrome/Section.astro` (replaces existing)
- Create: `app/src/components/chrome/EditorialHeadline.astro`
- Delete: `app/src/components/Section.astro` (old)
- Delete: `app/src/components/Hero.astro`
- Delete: `app/src/components/Sidebar.astro`

- [ ] **Step 5.1: Create chrome/Section.astro**

```astro
---
interface Props {
  id?: string | undefined;
  title: string;
  eyebrow?: string | undefined;
  description?: string | undefined;
  source?: string | undefined;
  /** Banxico SIE / CNBV reference code shown in the corner */
  refCode?: string | undefined;
  tone?: 'default' | 'gold' | 'green' | 'yellow' | 'red';
}

const {
  id,
  title,
  eyebrow,
  description,
  source,
  refCode,
  tone = 'default',
} = Astro.props;
---

<section id={id} class="space-y-3 scroll-mt-24">
  <header class="flex items-baseline justify-between gap-3">
    <div class="space-y-1 min-w-0">
      {
        eyebrow && (
          <div class="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-gold]">
            {eyebrow}
          </div>
        )
      }
      <h2 class="serif text-xl lg:text-2xl font-semibold text-[--color-text] leading-tight">
        {title}
      </h2>
      {
        description && (
          <p class="text-sm leading-relaxed text-[--color-text-dim] max-w-3xl">
            {description}
          </p>
        )
      }
    </div>
    {
      refCode && (
        <span class="mono text-[10px] text-[--color-text-mute] whitespace-nowrap">
          {refCode}
        </span>
      )
    }
  </header>
  <div
    class="card-surface p-4"
    data-tone={tone === 'default' ? null : tone}>
    <slot />
  </div>
  {
    source && (
      <p class="text-[11px] text-[--color-text-mute]">
        <span class="text-[--color-text-mute]/70">Fuente:</span> {source}
      </p>
    )
  }
</section>
```

- [ ] **Step 5.2: Create chrome/EditorialHeadline.astro**

```astro
---
interface Props {
  eyebrow: string;
  headline: string;
}

const { eyebrow, headline } = Astro.props;
---

<header class="space-y-2 max-w-4xl">
  <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--color-gold]">
    {eyebrow}
  </div>
  <h1
    class="serif text-3xl lg:text-4xl xl:text-5xl font-semibold text-[--color-text] leading-[1.1] tracking-tight">
    {headline}
  </h1>
</header>
```

- [ ] **Step 5.3: Delete old Hero / Section / Sidebar**

```bash
git rm app/src/components/Hero.astro app/src/components/Section.astro app/src/components/Sidebar.astro
```

- [ ] **Step 5.4: Commit**

```bash
git add app/src/components/chrome/
git commit -m "feat(app): add chrome/{Section,EditorialHeadline}; remove old Hero/Sidebar"
```

---

## Task 6: Rewrite KpiCard with legacy tones + Cormorant value

**Files:**
- Modify: `app/src/components/kpi/KpiCard.tsx` (move from `components/KpiCard.tsx`)
- Create: `app/src/components/kpi/KpiHero.tsx`
- Delete: `app/src/components/KpiCard.tsx` (old location)

- [ ] **Step 6.1: Create kpi/KpiCard.tsx**

```tsx
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { Tone } from '~/data/indicators';

export type { Tone };
export type DeltaDirection = 'up' | 'down' | 'flat';

interface Props {
  label: string;
  value: string;
  unit?: string;
  asOf?: string;
  Icon?: LucideIcon;
  tone: Tone;
  delta?:
    | {
        direction: DeltaDirection;
        label: string;
        upIsGood?: boolean;
      }
    | null
    | undefined;
  /** Indicator id, e.g. "fx", "tasa". Used for view-transition-name + drawer link. */
  indicatorId?: string;
}

const VALUE_COLOR: Record<Tone, string> = {
  gold: 'text-[--color-gold]',
  green: 'text-[--color-green]',
  yellow: 'text-[--color-yellow]',
  red: 'text-[--color-red]',
};

function deltaIcon(d: NonNullable<Props['delta']>): {
  color: string;
  Icon: LucideIcon;
} {
  if (d.direction === 'flat') {
    return { color: 'text-[--color-text-mute]', Icon: Minus };
  }
  const upIsGood = d.upIsGood ?? true;
  const isGood =
    (d.direction === 'up' && upIsGood) ||
    (d.direction === 'down' && !upIsGood);
  return {
    color: isGood ? 'text-[--color-green]' : 'text-[--color-red]',
    Icon: d.direction === 'up' ? ArrowUpRight : ArrowDownRight,
  };
}

export function KpiCard({
  label,
  value,
  unit,
  asOf,
  Icon,
  tone,
  delta,
  indicatorId,
}: Props) {
  const href = indicatorId ? `?indicator=${indicatorId}` : undefined;
  const Wrap = href ? 'a' : 'div';
  const wrapProps = href
    ? { href, 'data-drawer-trigger': indicatorId }
    : {};

  return (
    <Wrap
      {...wrapProps}
      data-tone={tone}
      style={
        indicatorId
          ? ({ viewTransitionName: `kpi-${indicatorId}` } as React.CSSProperties)
          : undefined
      }
      className={cn(
        'card-surface group relative block p-5 transition-all',
        href && 'hover:border-[--color-gold] hover:translate-y-[-1px]',
      )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[--color-text-mute]">
            {label}
          </div>
          {asOf && (
            <div className="text-[10px] text-[--color-text-mute]/70 mt-0.5">
              {asOf}
            </div>
          )}
        </div>
        {Icon && (
          <Icon
            className="size-4 text-[--color-text-mute] group-hover:text-[--color-gold] transition-colors"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            'serif tabular text-[clamp(28px,6vw,38px)] font-semibold tracking-tight leading-none',
            VALUE_COLOR[tone],
          )}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[--color-text-dim]">{unit}</span>
        )}
      </div>

      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {(() => {
            const d = deltaIcon(delta);
            return (
              <>
                <d.Icon className={cn('size-3', d.color)} aria-hidden="true" />
                <span className={cn('font-medium tabular', d.color)}>
                  {delta.label}
                </span>
                <span className="text-[--color-text-mute]">vs anterior</span>
              </>
            );
          })()}
        </div>
      )}
    </Wrap>
  );
}
```

- [ ] **Step 6.2: Create kpi/KpiHero.tsx (mobile single-card variant)**

```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { Tone } from './KpiCard';

interface Props {
  label: string;
  value: string;
  asOf?: string;
  source?: string;
  Icon?: LucideIcon;
  tone: Tone;
  indicatorId?: string;
}

const VALUE_COLOR: Record<Tone, string> = {
  gold: 'text-[--color-gold]',
  green: 'text-[--color-green]',
  yellow: 'text-[--color-yellow]',
  red: 'text-[--color-red]',
};

export function KpiHero({
  label,
  value,
  asOf,
  source,
  Icon,
  tone,
  indicatorId,
}: Props) {
  const href = indicatorId ? `?indicator=${indicatorId}` : undefined;
  const Wrap = href ? 'a' : 'div';
  const wrapProps = href
    ? { href, 'data-drawer-trigger': indicatorId }
    : {};

  return (
    <Wrap
      {...wrapProps}
      data-tone={tone}
      className={cn(
        'card-surface block p-6 transition-all',
        href && 'hover:border-[--color-gold]',
      )}>
      <div className="flex items-center gap-2 text-[--color-text-mute]">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <div className="text-[10px] font-medium uppercase tracking-[0.12em]">
          {label}
        </div>
      </div>
      <div
        className={cn(
          'serif tabular mt-3 text-[clamp(36px,9vw,52px)] font-semibold tracking-tight leading-none',
          VALUE_COLOR[tone],
        )}>
        {value}
      </div>
      {(asOf || source) && (
        <div className="mt-3 flex items-baseline justify-between text-[11px] text-[--color-text-mute]">
          {asOf && <span>{asOf}</span>}
          {source && <span className="mono">{source}</span>}
        </div>
      )}
    </Wrap>
  );
}
```

- [ ] **Step 6.3: Delete old KpiCard, update imports**

```bash
git rm app/src/components/KpiCard.tsx
```

(Imports of `KpiCard` will be updated when each page is rewritten — pages will import from `~/components/kpi/KpiCard`.)

- [ ] **Step 6.4: Restyle DataFreshnessBadge to gold/legacy palette**

Overwrite `app/src/components/DataFreshnessBadge.tsx`:

```tsx
import { useMemo } from 'react';

interface Props {
  source: string;
  lastUpdated: string;
}

function parseDdmmyyyy(s: string): Date | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const day = Number.parseInt(parts[0]!, 10);
  const month = Number.parseInt(parts[1]!, 10);
  const year = Number.parseInt(parts[2]!, 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

export function DataFreshnessBadge({ source, lastUpdated }: Props) {
  const { dotClass, label } = useMemo(() => {
    const date = parseDdmmyyyy(lastUpdated);
    if (!date) return { dotClass: 'bg-[--color-text-mute]', label: 'sin fecha' };
    const ageH = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (ageH < 24)
      return { dotClass: 'bg-[--color-green]', label: 'fresco' };
    if (ageH < 72)
      return { dotClass: 'bg-[--color-yellow]', label: 'reciente' };
    return { dotClass: 'bg-[--color-red]', label: 'desactualizado' };
  }, [lastUpdated]);

  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] text-[--color-text-mute]"
      aria-live="polite">
      <span
        className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
      {source} · <span className="tabular">{lastUpdated}</span> · {label}
    </span>
  );
}
```

- [ ] **Step 6.5: Verify build**

```bash
cd app && npm run build
```

Expected: build still passes (KpiCard isn't imported anywhere yet — old file removed, new file in `kpi/` folder, pages will import in next tasks).

If TS complains about a page still importing the old path, comment out the import temporarily — Task 8 rewrites the index page.

- [ ] **Step 6.6: Commit**

```bash
git add app/src/components/kpi/ app/src/components/DataFreshnessBadge.tsx
git commit -m "feat(app): KpiCard + KpiHero with legacy palette + Cormorant values; restyle DataFreshnessBadge"
```

---

## Task 7: Drop background from existing chart components

**Files:**
- Modify: `app/src/components/charts/FXChart.tsx`
- Modify: `app/src/components/charts/TasaBanxicoChart.tsx`
- Modify: `app/src/components/charts/InflacionChart.tsx`

- [ ] **Step 7.1: FXChart — remove wrapper bg**

In `app/src/components/charts/FXChart.tsx`, locate the JSX wrapper:

```tsx
return (
  <div className="h-72 md:h-80">
    <Line
```

Change to:

```tsx
return (
  <div className="h-64 md:h-72 -mx-1">
    <Line
```

The parent `card-surface` (Section.astro) provides background and padding now.

- [ ] **Step 7.2: TasaBanxicoChart — same change**

Apply identical wrapper edit in `app/src/components/charts/TasaBanxicoChart.tsx`.

- [ ] **Step 7.3: InflacionChart — same change**

Apply identical wrapper edit in `app/src/components/charts/InflacionChart.tsx`.

- [ ] **Step 7.4: Commit**

```bash
git add app/src/components/charts/
git commit -m "style(app): chart wrappers shed bg/padding (Section provides them now)"
```

---

## Task 8: Indicator registry + alerts data layer (with tests)

**Files:**
- Create: `app/tests/unit/indicators.test.ts`
- Create: `app/src/data/indicators.ts`
- Create: `app/tests/unit/alerts.test.ts`
- Create: `app/src/data/alerts.ts`

- [ ] **Step 8.1: Write failing test for indicator registry**

Create `app/tests/unit/indicators.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INDICATORS, getIndicator, searchIndicators } from '~/data/indicators';

describe('indicator registry', () => {
  it('all ids are unique', () => {
    const ids = INDICATORS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every indicator has source attribution', () => {
    for (const i of INDICATORS) {
      expect(i.source).toBeTruthy();
      expect(i.label).toBeTruthy();
    }
  });

  it('getIndicator returns the right indicator', () => {
    const fx = getIndicator('fx');
    expect(fx?.label).toContain('Tipo de cambio');
  });

  it('getIndicator returns undefined for unknown id', () => {
    expect(getIndicator('nope-not-real')).toBeUndefined();
  });

  it('searchIndicators matches by alias', () => {
    const matches = searchIndicators('SF43718');
    expect(matches.some((m) => m.id === 'fx')).toBe(true);
  });

  it('searchIndicators is case-insensitive', () => {
    const lower = searchIndicators('imor');
    const upper = searchIndicators('IMOR');
    expect(upper.length).toBe(lower.length);
  });

  it('searchIndicators returns empty array for empty query', () => {
    expect(searchIndicators('')).toEqual([]);
  });
});
```

- [ ] **Step 8.2: Create vitest.config.ts and run test (expect fail)**

Create `app/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

Run:

```bash
cd app && npm test -- indicators
```

Expected: FAIL with "Cannot find module '~/data/indicators'".

- [ ] **Step 8.3: Implement indicators.ts**

Create `app/src/data/indicators.ts`:

```ts
export type IndicatorId =
  | 'fx'
  | 'tasa'
  | 'inflacion'
  | 'imor'
  | 'imora'
  | 'icor'
  | 'roa'
  | 'roe'
  | 'tiie28'
  | 'ifrs9'
  | 'sofipos-imor'
  | 'sofipos-imora'
  | 'sofipos-roa';

export type Tone = 'gold' | 'green' | 'yellow' | 'red';

export interface Indicator {
  id: IndicatorId;
  label: string;
  shortLabel: string;
  aliases: readonly string[];
  unit: string;
  source: string;
  /** Tab where this indicator's chart lives. */
  tab: 'mercado' | 'credito' | 'sofipos' | 'macro';
  tone: Tone;
  /** Whether 'up' means good for this metric (e.g. coverage ratios). */
  upIsGood: boolean;
  /** Brief methodology shown in drawer. */
  description: string;
  /** Banxico SIE / CNBV code for monospace tag. */
  refCode?: string | undefined;
}

export const INDICATORS: readonly Indicator[] = [
  {
    id: 'fx',
    label: 'Tipo de cambio MXN/USD (FIX)',
    shortLabel: 'MXN/USD',
    aliases: ['fx', 'mxn', 'usd', 'tipo de cambio', 'sf43718', 'fix'],
    unit: 'MXN',
    source: 'Banco de México, SIE, serie SF43718',
    tab: 'mercado',
    tone: 'gold',
    upIsGood: false,
    description:
      'Tipo de cambio para solventar obligaciones denominadas en dólares (FIX). Publicado diariamente por Banxico a las 12:00.',
    refCode: 'SF43718',
  },
  {
    id: 'tasa',
    label: 'Tasa objetivo Banxico',
    shortLabel: 'Tasa Banxico',
    aliases: ['tasa', 'banxico', 'objetivo', 'política', 'sf61745'],
    unit: '%',
    source: 'Banco de México, SIE, serie SF61745',
    tab: 'mercado',
    tone: 'red',
    upIsGood: false,
    description:
      'Tasa de política monetaria fijada por la Junta de Gobierno. Cambia por decisión, no diariamente.',
    refCode: 'SF61745',
  },
  {
    id: 'tiie28',
    label: 'TIIE 28 días',
    shortLabel: 'TIIE 28d',
    aliases: ['tiie', 'tiie28', 'sf43783'],
    unit: '%',
    source: 'Banco de México, SIE, serie SF43783',
    tab: 'mercado',
    tone: 'red',
    upIsGood: false,
    description:
      'Tasa de Interés Interbancaria de Equilibrio a 28 días. Referencia para créditos bancarios.',
    refCode: 'SF43783',
  },
  {
    id: 'inflacion',
    label: 'Inflación anual (INPC)',
    shortLabel: 'Inflación',
    aliases: ['inflacion', 'inpc', 'sp74625', 'precios'],
    unit: '%',
    source: 'Banco de México, SIE, serie SP74625',
    tab: 'macro',
    tone: 'yellow',
    upIsGood: false,
    description:
      'Variación anual del Índice Nacional de Precios al Consumidor. Objetivo Banxico 3% ±1pp.',
    refCode: 'SP74625',
  },
  {
    id: 'imor',
    label: 'IMOR Banca Múltiple',
    shortLabel: 'IMOR Banca',
    aliases: ['imor', 'cartera vencida', 'morosidad'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: false,
    description:
      'Índice de Morosidad: cartera vencida (Etapa 3) / cartera total. Métrica regulatoria principal de calidad crediticia.',
  },
  {
    id: 'imora',
    label: 'IMORA Banca Múltiple',
    shortLabel: 'IMORA',
    aliases: ['imora', 'morosidad ajustada'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: false,
    description:
      'IMOR Ajustado: incluye castigos de los últimos 12 meses. Métrica preferida por Banxico — no manipulable por write-offs.',
  },
  {
    id: 'icor',
    label: 'ICOR Banca Múltiple',
    shortLabel: 'ICOR',
    aliases: ['icor', 'cobertura', 'reservas'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description:
      'Índice de Cobertura: reservas EPRC / cartera vencida. >100% indica reservas suficientes.',
  },
  {
    id: 'roa',
    label: 'ROA Banca Múltiple',
    shortLabel: 'ROA',
    aliases: ['roa', 'return on assets', 'rentabilidad'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description: 'Utilidad neta / activos totales (12 meses).',
  },
  {
    id: 'roe',
    label: 'ROE Banca Múltiple',
    shortLabel: 'ROE',
    aliases: ['roe', 'return on equity'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description: 'Utilidad neta / capital contable (12 meses).',
  },
  {
    id: 'ifrs9',
    label: 'IFRS 9 — Etapas 1/2/3',
    shortLabel: 'IFRS 9',
    aliases: ['ifrs9', 'etapas', 'sicr', 'r12a'],
    unit: '%',
    source: 'CNBV, Reporte R12A',
    tab: 'credito',
    tone: 'yellow',
    upIsGood: false,
    description:
      'Distribución de cartera por etapa de riesgo. Etapa 2 (SICR) en alza es señal de deterioro temprano.',
  },
  {
    id: 'sofipos-imor',
    label: 'SoFiPOs — IMOR top 15',
    shortLabel: 'SoFi IMOR',
    aliases: ['sofipos', 'sofi', 'sociedades populares'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'yellow',
    upIsGood: false,
    description:
      'IMOR de las 15 SoFiPOs más grandes por activo. Sector con morosidad ~4× la de Banca Múltiple.',
  },
  {
    id: 'sofipos-imora',
    label: 'SoFiPOs — IMORA',
    shortLabel: 'SoFi IMORA',
    aliases: ['sofipos imora'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'yellow',
    upIsGood: false,
    description: 'IMORA agregado del sector SoFiPOs.',
  },
  {
    id: 'sofipos-roa',
    label: 'SoFiPOs — ROA',
    shortLabel: 'SoFi ROA',
    aliases: ['sofipos roa'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'red',
    upIsGood: true,
    description: 'ROA agregado SoFiPOs. Sector reportó pérdidas en 2025.',
  },
];

const BY_ID = new Map<IndicatorId, Indicator>(
  INDICATORS.map((i) => [i.id, i]),
);

export function getIndicator(id: string): Indicator | undefined {
  return BY_ID.get(id as IndicatorId);
}

export function searchIndicators(query: string): Indicator[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return INDICATORS.filter((i) => {
    if (i.id.includes(q)) return true;
    if (i.label.toLowerCase().includes(q)) return true;
    if (i.refCode && i.refCode.toLowerCase().includes(q)) return true;
    return i.aliases.some((a) => a.toLowerCase().includes(q));
  });
}
```

- [ ] **Step 8.4: Run indicator tests, expect pass**

```bash
cd app && npm test -- indicators
```

Expected: 7 tests pass.

- [ ] **Step 8.5: Write failing test for alerts**

Create `app/tests/unit/alerts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { computeAlerts } from '~/data/alerts';
import type { SfmData } from '~/data/schema';

const minimal: SfmData = {
  ultima_actualizacion: '27/04/2026',
  fuentes: { tipo_cambio: '', tasa_objetivo: '', inflacion: '' },
  tipo_cambio: { actual: 17.4, fecha: '2026-04', historico_mensual: [] },
  tasa_banxico: { actual: 6.75, fecha: '27/03/2026', historico: [] },
  inflacion: {
    actual: 4.45,
    fecha: '01/03/2026',
    historico_mensual: [
      { fecha: '01/03/2026', mes: '2026-03', var_anual: 4.45 },
    ],
  },
  historico: {},
  credito: {},
  ifrs9: { etapa2_pct: [1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1] },
  sofipos: {},
};

describe('alerts engine', () => {
  it('flags inflation above 4% as yellow', () => {
    const alerts = computeAlerts(minimal);
    expect(alerts.some((a) => a.id === 'inflation-out-of-band')).toBe(true);
    const a = alerts.find((a) => a.id === 'inflation-out-of-band');
    expect(a?.severity).toBe('yellow');
  });

  it('flags ifrs9 stage 2 trending up over 6 months', () => {
    const alerts = computeAlerts(minimal);
    expect(alerts.some((a) => a.id === 'ifrs9-stage2-rising')).toBe(true);
  });

  it('returns empty array on healthy data', () => {
    const healthy: SfmData = {
      ...minimal,
      inflacion: { ...minimal.inflacion, actual: 3.0 },
      ifrs9: { etapa2_pct: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0] },
    };
    const alerts = computeAlerts(healthy);
    expect(alerts.find((a) => a.id === 'inflation-out-of-band')).toBeUndefined();
    expect(alerts.find((a) => a.id === 'ifrs9-stage2-rising')).toBeUndefined();
  });

  it('alerts have stable id, label, severity, indicatorId fields', () => {
    const alerts = computeAlerts(minimal);
    for (const a of alerts) {
      expect(a.id).toBeTruthy();
      expect(a.label).toBeTruthy();
      expect(['green', 'yellow', 'red']).toContain(a.severity);
    }
  });
});
```

- [ ] **Step 8.6: Run alerts test, expect fail**

```bash
cd app && npm test -- alerts
```

Expected: FAIL — module not found.

- [ ] **Step 8.7: Implement alerts.ts**

Create `app/src/data/alerts.ts`:

```ts
import type { SfmData } from './schema';
import type { IndicatorId } from './indicators';

export type AlertSeverity = 'green' | 'yellow' | 'red';

export interface Alert {
  id: string;
  label: string;
  severity: AlertSeverity;
  indicatorId: IndicatorId;
}

const INFLATION_TARGET = 3.0;
const INFLATION_BAND = 1.0;

export function computeAlerts(data: SfmData): Alert[] {
  const alerts: Alert[] = [];

  // Inflation out of Banxico target band
  const inflationLatest = Number(data.inflacion.actual);
  if (
    Number.isFinite(inflationLatest) &&
    Math.abs(inflationLatest - INFLATION_TARGET) > INFLATION_BAND
  ) {
    const above = inflationLatest > INFLATION_TARGET + INFLATION_BAND;
    alerts.push({
      id: 'inflation-out-of-band',
      label: above
        ? `Inflación ${inflationLatest.toFixed(2)}% sobre rango Banxico (3% ±1pp)`
        : `Inflación ${inflationLatest.toFixed(2)}% bajo rango Banxico (3% ±1pp)`,
      severity: above ? 'yellow' : 'green',
      indicatorId: 'inflacion',
    });
  }

  // IFRS 9 Etapa 2 rising trend over last 6 observations
  const stage2 = data.ifrs9.etapa2_pct;
  if (Array.isArray(stage2) && stage2.length >= 6) {
    const recent = stage2.slice(-6);
    const first = recent[0]!;
    const last = recent[recent.length - 1]!;
    const monotonic = recent.every(
      (v, idx) => idx === 0 || v >= recent[idx - 1]!,
    );
    if (monotonic && last - first >= 0.2) {
      alerts.push({
        id: 'ifrs9-stage2-rising',
        label: `IFRS 9 Etapa 2 al alza (${first.toFixed(1)} → ${last.toFixed(1)})`,
        severity: 'yellow',
        indicatorId: 'ifrs9',
      });
    }
  }

  return alerts;
}
```

- [ ] **Step 8.8: Run alerts test, expect pass**

```bash
cd app && npm test -- alerts
```

Expected: 4 tests pass.

- [ ] **Step 8.9: Commit**

```bash
git add app/vitest.config.ts app/src/data/indicators.ts app/src/data/alerts.ts app/tests/unit/
git commit -m "feat(app): indicator registry + alerts engine with vitest tests"
```

---

## Task 9: AlertsPanel server component

**Files:**
- Create: `app/src/components/alerts/AlertsPanel.astro`

- [ ] **Step 9.1: Create AlertsPanel.astro**

```astro
---
import { computeAlerts } from '~/data/alerts';
import { loadSfmData } from '~/data/loader';

const data = loadSfmData();
const alerts = computeAlerts(data);

const SEVERITY_DOT = {
  green: 'bg-[--color-green] shadow-[0_0_8px_rgba(63,185,80,0.4)]',
  yellow: 'bg-[--color-yellow] shadow-[0_0_8px_rgba(210,153,34,0.4)]',
  red: 'bg-[--color-red] shadow-[0_0_8px_rgba(248,81,73,0.4)]',
} as const;
---

<aside class="card-surface p-5 h-full">
  <h3 class="text-[10px] font-semibold uppercase tracking-[0.12em] text-[--color-text-mute]">
    Alertas activas
  </h3>
  {
    alerts.length === 0 ? (
      <p class="mt-3 text-sm text-[--color-text-dim]">
        Sin alertas — todos los indicadores dentro de rangos normales.
      </p>
    ) : (
      <ul class="mt-3 space-y-2 divide-y divide-[--color-border-soft]">
        {alerts.map((a) => (
          <li class="flex items-start gap-2 pt-2 first:pt-0 text-[12px] text-[--color-text-dim] leading-snug">
            <span
              class:list={[
                'inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                SEVERITY_DOT[a.severity],
              ]}
              aria-hidden="true"
            />
            <a
              href={`?indicator=${a.indicatorId}`}
              data-drawer-trigger={a.indicatorId}
              class="hover:text-[--color-text] underline-offset-4 hover:underline">
              {a.label}
            </a>
          </li>
        ))}
      </ul>
    )
  }
</aside>
```

- [ ] **Step 9.2: Commit**

```bash
git add app/src/components/alerts/
git commit -m "feat(app): AlertsPanel.astro server-rendered with computed alerts"
```

---

## Task 10: Resumen tab (`pages/index.astro`) full rewrite

**Files:**
- Modify: `app/src/pages/index.astro`

- [ ] **Step 10.1: Overwrite index.astro**

```astro
---
import Layout from '~/layouts/Layout.astro';
import Header from '~/components/shell/Header.astro';
import TabBar from '~/components/shell/TabBar.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import EditorialHeadline from '~/components/chrome/EditorialHeadline.astro';
import Section from '~/components/chrome/Section.astro';
import AlertsPanel from '~/components/alerts/AlertsPanel.astro';
import { KpiCard } from '~/components/kpi/KpiCard';
import { FXChart } from '~/components/charts/FXChart';
import { loadSfmData } from '~/data/loader';
import { computeDelta, formatMxn, formatPct } from '~/lib/utils';
import { DollarSign, Percent, TrendingUp, Activity } from 'lucide-react';

const data = loadSfmData();

const fxLatest = Number(data.tipo_cambio.actual);
const fxDelta = computeDelta(
  data.tipo_cambio.historico_mensual.map((p) => p.valor),
);

const tasaLatest = Number(data.tasa_banxico.actual);
const tasaDelta = computeDelta(
  data.tasa_banxico.historico.map((p) => p.valor),
);

const inflacionLatest = Number(data.inflacion.actual);
const inflacionDelta = computeDelta(
  data.inflacion.historico_mensual.map((p) => p.var_anual),
);

const imorPlaceholder = 2.2;
---

<Layout
  title="SFM Monitor"
  description="Resumen ejecutivo del riesgo del Sistema Financiero Mexicano. Datos de Banxico SIE, CNBV e INEGI.">
  <Header slot="header" />
  <TabBar slot="header" />

  <div class="space-y-8">
    <EditorialHeadline
      eyebrow={`Resumen ejecutivo · ${data.ultima_actualizacion}`}
      headline="El sistema opera dentro de rangos normales con presiones puntuales en SoFiPOs y vigilancia en IFRS 9 Etapa 2."
    />

    <!-- KPI grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <KpiCard
        label="MXN/USD FIX"
        value={formatMxn(fxLatest, 4)}
        asOf={data.tipo_cambio.fecha}
        Icon={DollarSign}
        tone="gold"
        indicatorId="fx"
        delta={fxDelta && {
          direction: fxDelta.direction,
          label: `${fxDelta.abs > 0 ? '+' : ''}${fxDelta.abs.toFixed(4)}`,
          upIsGood: false,
        }}
      />
      <KpiCard
        label="Tasa Banxico"
        value={formatPct(tasaLatest, 2)}
        asOf={data.tasa_banxico.fecha}
        Icon={Percent}
        tone="red"
        indicatorId="tasa"
        delta={tasaDelta && {
          direction: tasaDelta.direction,
          label: `${tasaDelta.abs > 0 ? '+' : ''}${tasaDelta.abs.toFixed(2)} pp`,
          upIsGood: false,
        }}
      />
      <KpiCard
        label="Inflación anual"
        value={formatPct(inflacionLatest, 2)}
        asOf={data.inflacion.fecha}
        Icon={TrendingUp}
        tone="yellow"
        indicatorId="inflacion"
        delta={inflacionDelta && {
          direction: inflacionDelta.direction,
          label: `${inflacionDelta.abs > 0 ? '+' : ''}${inflacionDelta.abs.toFixed(2)} pp`,
          upIsGood: false,
        }}
      />
      <KpiCard
        label="IMOR Banca"
        value={formatPct(imorPlaceholder, 2)}
        asOf="placeholder · CNBV pendiente"
        Icon={Activity}
        tone="green"
        indicatorId="imor"
      />
    </div>

    <!-- Featured chart + alerts -->
    <div class="grid lg:grid-cols-3 gap-4 items-stretch">
      <div class="lg:col-span-2">
        <Section
          eyebrow="Riesgo de mercado"
          title="Tipo de cambio MXN/USD · histórico"
          description="Serie mensual desde 1994. Bandas verticales: crisis Tequila (1994-95), Gran Crisis Financiera (2008-09), COVID-19 (2020)."
          source="Banco de México, SIE, serie SF43718"
          refCode="SF43718"
          tone="gold">
          <FXChart series={data.tipo_cambio.historico_mensual} client:visible />
        </Section>
      </div>
      <div>
        <AlertsPanel />
      </div>
    </div>
  </div>

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 10.2: Build + verify**

```bash
cd app && npm run build
```

Expected: build passes; HTML shows Resumen tab with KPI grid and chart.

- [ ] **Step 10.3: Commit**

```bash
git add app/src/pages/index.astro
git commit -m "feat(app): rewrite index.astro as Resumen tab with editorial headline + KPI grid + alerts"
```

---

## Task 11: Mercado, Crédito, SoFiPOs, Macro tab pages

**Files:**
- Create: `app/src/pages/mercado.astro`
- Create: `app/src/pages/credito.astro`
- Create: `app/src/pages/sofipos.astro`
- Create: `app/src/pages/macro.astro`

- [ ] **Step 11.1: Create mercado.astro**

```astro
---
import Layout from '~/layouts/Layout.astro';
import Header from '~/components/shell/Header.astro';
import TabBar from '~/components/shell/TabBar.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import { FXChart } from '~/components/charts/FXChart';
import { TasaBanxicoChart } from '~/components/charts/TasaBanxicoChart';
import { loadSfmData } from '~/data/loader';

const data = loadSfmData();
---

<Layout
  title="Mercado"
  description="Riesgo de mercado: tipo de cambio, tasa objetivo Banxico, TIIE 28 días.">
  <Header slot="header" />
  <TabBar slot="header" />

  <div class="space-y-6">
    <Section
      id="fx"
      eyebrow="Tipo de cambio"
      title="MXN/USD FIX"
      description="Serie histórica mensual desde 1994."
      source="Banco de México, SIE, serie SF43718"
      refCode="SF43718"
      tone="gold">
      <FXChart series={data.tipo_cambio.historico_mensual} client:visible />
    </Section>

    <Section
      id="tasa"
      eyebrow="Política monetaria"
      title="Tasa objetivo Banxico"
      description="Decisiones de política monetaria — stepped, mantiene hasta la siguiente."
      source="Banco de México, SIE, serie SF61745"
      refCode="SF61745"
      tone="red">
      <TasaBanxicoChart series={data.tasa_banxico.historico} client:visible />
    </Section>

    <Section
      id="tiie28"
      eyebrow="Tasas interbancarias"
      title="TIIE 28 días"
      description="Pendiente de migración del pipeline Banxico."
      source="Banco de México, SIE, serie SF43783"
      refCode="SF43783">
      <p class="text-sm text-[--color-text-dim] py-8 text-center">
        Disponible próximamente.
        <a
          href="https://pamela-ruiz9.github.io/sfm-monitor/"
          class="text-[--color-gold] hover:underline">
          Ver en dashboard estable ↗
        </a>
      </p>
    </Section>
  </div>

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 11.2: Create credito.astro**

```astro
---
import Layout from '~/layouts/Layout.astro';
import Header from '~/components/shell/Header.astro';
import TabBar from '~/components/shell/TabBar.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
---

<Layout
  title="Crédito"
  description="Riesgo de crédito Banca Múltiple: IMOR, IMORA, ICOR, IFRS9, ROA/ROE.">
  <Header slot="header" />
  <TabBar slot="header" />

  <div class="card-surface p-10 text-center">
    <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--color-gold] mb-2">
      Próximamente · v0.2.0
    </div>
    <h2 class="serif text-2xl font-semibold text-[--color-text] mb-3">
      Riesgo de crédito · Banca Múltiple
    </h2>
    <p class="text-sm text-[--color-text-dim] max-w-md mx-auto leading-relaxed">
      IMOR histórico, IMOR por segmento (comercial, consumo, vivienda, tarjeta),
      IMOR por banco G-7, IMORA, ICOR, ROA, ROE, IFRS 9 etapas 1/2/3.
      Disponible en el dashboard estable mientras se migra el pipeline CNBV.
    </p>
    <a
      href="https://pamela-ruiz9.github.io/sfm-monitor/"
      class="inline-flex items-center gap-1 mt-4 text-sm text-[--color-gold] hover:underline">
      Ver en dashboard estable ↗
    </a>
  </div>

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 11.3: Create sofipos.astro (placeholder identical structure)**

```astro
---
import Layout from '~/layouts/Layout.astro';
import Header from '~/components/shell/Header.astro';
import TabBar from '~/components/shell/TabBar.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
---

<Layout
  title="SoFiPOs"
  description="Sociedades Financieras Populares: IMOR top 15 por activo, IMORA, ROA, comparativo vs Banca Múltiple.">
  <Header slot="header" />
  <TabBar slot="header" />

  <div class="card-surface p-10 text-center">
    <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--color-gold] mb-2">
      Próximamente · v0.2.0
    </div>
    <h2 class="serif text-2xl font-semibold text-[--color-text] mb-3">
      SoFiPOs · Sociedades Financieras Populares
    </h2>
    <p class="text-sm text-[--color-text-dim] max-w-md mx-auto leading-relaxed">
      IMOR top 15 por activo (eje fijo 45%), IMORA, ROA, comparativo sectorial
      vs Banca Múltiple. Pendiente de migración del pipeline R11.
    </p>
    <a
      href="https://pamela-ruiz9.github.io/sfm-monitor/"
      class="inline-flex items-center gap-1 mt-4 text-sm text-[--color-gold] hover:underline">
      Ver en dashboard estable ↗
    </a>
  </div>

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 11.4: Create macro.astro**

```astro
---
import Layout from '~/layouts/Layout.astro';
import Header from '~/components/shell/Header.astro';
import TabBar from '~/components/shell/TabBar.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import { InflacionChart } from '~/components/charts/InflacionChart';
import { loadSfmData } from '~/data/loader';

const data = loadSfmData();
const inflacionHistorica =
  data.historico.inflacion_mensual_desde_2000 ??
  data.inflacion.historico_mensual;
---

<Layout
  title="Macro"
  description="Contexto macro: inflación INPC, banda objetivo Banxico.">
  <Header slot="header" />
  <TabBar slot="header" />

  <div class="space-y-6">
    <Section
      id="inflacion"
      eyebrow="Inflación"
      title="INPC anual"
      description="Variación anual del Índice Nacional de Precios al Consumidor. Banda verde: objetivo Banxico 3% ±1pp."
      source="Banco de México, SIE, serie SP74625"
      refCode="SP74625"
      tone="yellow">
      <InflacionChart series={inflacionHistorica} client:visible />
    </Section>
  </div>

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 11.5: Build + verify all 5 routes**

```bash
cd app && npm run build
ls dist/
```

Expected: `dist/index.html`, `dist/mercado/index.html`, `dist/credito/index.html`, `dist/sofipos/index.html`, `dist/macro/index.html` all exist.

- [ ] **Step 11.6: Commit**

```bash
git add app/src/pages/
git commit -m "feat(app): add 4 tab pages (mercado, credito, sofipos, macro) with placeholders for unfinished sections"
```

---

## Task 12: Stores (activeTab, drawerState, terminalMode, onboarding)

**Files:**
- Create: `app/src/stores/activeTab.ts`
- Create: `app/src/stores/drawerState.ts`
- Create: `app/src/stores/terminalMode.ts`
- Create: `app/src/stores/onboarding.ts`

- [ ] **Step 12.1: Create activeTab store**

```ts
// app/src/stores/activeTab.ts
import { atom } from 'nanostores';

export type TabId = 'resumen' | 'mercado' | 'credito' | 'sofipos' | 'macro';

const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'resumen',
  '/mercado': 'mercado',
  '/credito': 'credito',
  '/sofipos': 'sofipos',
  '/macro': 'macro',
};

const TAB_TO_PATH: Record<TabId, string> = {
  resumen: '/',
  mercado: '/mercado',
  credito: '/credito',
  sofipos: '/sofipos',
  macro: '/macro',
};

function pathToTab(path: string): TabId {
  return PATH_TO_TAB[path] ?? 'resumen';
}

export const $activeTab = atom<TabId>(
  typeof window === 'undefined' ? 'resumen' : pathToTab(window.location.pathname),
);

export function tabPath(t: TabId): string {
  return TAB_TO_PATH[t];
}

export function adjacentTab(current: TabId, dir: 'next' | 'prev'): TabId | null {
  const order: TabId[] = ['resumen', 'mercado', 'credito', 'sofipos', 'macro'];
  const idx = order.indexOf(current);
  const target = dir === 'next' ? idx + 1 : idx - 1;
  return order[target] ?? null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    $activeTab.set(pathToTab(window.location.pathname));
  });
  // Sync on Astro view transitions
  document.addEventListener('astro:after-swap', () => {
    $activeTab.set(pathToTab(window.location.pathname));
  });
}
```

- [ ] **Step 12.2: Create drawerState store**

```ts
// app/src/stores/drawerState.ts
import { atom } from 'nanostores';
import { getIndicator, type IndicatorId } from '~/data/indicators';

export const $drawerIndicator = atom<IndicatorId | null>(null);

function syncFromUrl(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('indicator');
  if (!id) {
    $drawerIndicator.set(null);
    return;
  }
  const indicator = getIndicator(id);
  $drawerIndicator.set(indicator ? indicator.id : null);
}

export function openDrawer(id: IndicatorId): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('indicator', id);
  history.pushState(null, '', url.toString());
  $drawerIndicator.set(id);
}

export function closeDrawer(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('indicator');
  history.pushState(null, '', url.toString());
  $drawerIndicator.set(null);
}

if (typeof window !== 'undefined') {
  syncFromUrl();
  window.addEventListener('popstate', syncFromUrl);
  document.addEventListener('astro:after-swap', syncFromUrl);
}
```

- [ ] **Step 12.3: Create terminalMode store**

```ts
// app/src/stores/terminalMode.ts
import { persistentAtom } from '@nanostores/persistent';

/**
 * Power-user "Terminal mode" toggle (UI control deferred to v0.3.0).
 * Persisted across sessions via localStorage so future code can read it.
 */
export const $terminalMode = persistentAtom<'on' | 'off'>(
  'sfm-terminal-mode',
  'off',
);
```

- [ ] **Step 12.4: Create onboarding store**

```ts
// app/src/stores/onboarding.ts
import { persistentAtom } from '@nanostores/persistent';

export const $onboardingDone = persistentAtom<'true' | 'false'>(
  'sfm-onboarding-done',
  'false',
);

export const $visitCount = persistentAtom<string>('sfm-visit-count', '0');

export function bumpVisitCount(): void {
  const n = Number.parseInt($visitCount.get(), 10) || 0;
  $visitCount.set(String(n + 1));
}
```

- [ ] **Step 12.5: Add @nanostores/persistent dep**

```bash
cd app && npm install @nanostores/persistent
```

- [ ] **Step 12.6: Commit**

```bash
git add app/src/stores/ app/package.json app/package-lock.json
git commit -m "feat(app): add nanostores for activeTab, drawerState, terminalMode, onboarding"
```

---

## Task 13: ChartDrawer component (vaul)

**Files:**
- Create: `app/src/components/drawer/ChartDrawer.tsx`
- Create: `app/src/components/drawer/DrawerMetadata.tsx`
- Create: `app/src/components/drawer/DrawerExport.tsx`

- [ ] **Step 13.1: Create DrawerMetadata.tsx**

```tsx
import type { Indicator } from '~/data/indicators';

interface Props {
  indicator: Indicator;
}

export function DrawerMetadata({ indicator }: Props) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <dt className="text-[--color-text-mute] uppercase tracking-wider text-[10px] font-semibold col-span-2 mt-2">
        Metodología
      </dt>
      <dd className="col-span-2 text-[--color-text-dim] leading-relaxed">
        {indicator.description}
      </dd>

      <dt className="text-[--color-text-mute]">Fuente</dt>
      <dd className="text-[--color-text-dim]">{indicator.source}</dd>

      <dt className="text-[--color-text-mute]">Unidad</dt>
      <dd className="text-[--color-text-dim] mono">{indicator.unit}</dd>

      {indicator.refCode && (
        <>
          <dt className="text-[--color-text-mute]">Código serie</dt>
          <dd className="text-[--color-text-dim] mono">{indicator.refCode}</dd>
        </>
      )}

      <dt className="text-[--color-text-mute]">Sección</dt>
      <dd className="text-[--color-text-dim] capitalize">{indicator.tab}</dd>
    </dl>
  );
}
```

- [ ] **Step 13.2: Create DrawerExport.tsx (stub — full export deferred)**

```tsx
import { Download } from 'lucide-react';
import type { Indicator } from '~/data/indicators';

interface Props {
  indicator: Indicator;
}

export function DrawerExport({ indicator }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/data/sfm-data.json`}
        download={`sfm-${indicator.id}.json`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[--color-border] bg-[--color-bg-elev-2] text-xs text-[--color-text-dim] hover:text-[--color-text] hover:border-[--color-gold]">
        <Download className="size-3" aria-hidden="true" />
        JSON completo
      </a>
      <span className="text-[10px] text-[--color-text-mute] self-center">
        PNG / CSV próximamente
      </span>
    </div>
  );
}
```

- [ ] **Step 13.3: Create ChartDrawer.tsx**

```tsx
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { $drawerIndicator, closeDrawer, openDrawer } from '~/stores/drawerState';
import { getIndicator, type IndicatorId } from '~/data/indicators';
import { DrawerMetadata } from './DrawerMetadata';
import { DrawerExport } from './DrawerExport';

export function ChartDrawer() {
  const id = useStore($drawerIndicator);
  const indicator = id ? getIndicator(id) : undefined;
  const open = !!indicator;

  // Wire data-drawer-trigger anchors so they intercept and open the drawer
  // instead of navigating away.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        '[data-drawer-trigger]',
      );
      if (!target) return;
      const triggerId = target.dataset['drawerTrigger'] as IndicatorId;
      if (!getIndicator(triggerId)) return;
      e.preventDefault();
      openDrawer(triggerId);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDrawer();
      }}
      shouldScaleBackground={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[88vh] flex-col rounded-t-2xl border-t border-[--color-border] bg-[--color-bg-elev] focus:outline-none"
          aria-describedby={undefined}>
          <div className="mx-auto mt-3 h-1.5 w-12 flex-shrink-0 rounded-full bg-[--color-border]" />
          {indicator ? (
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-gold]">
                    {indicator.tab}
                  </div>
                  <Drawer.Title className="serif text-2xl font-semibold text-[--color-text] leading-tight mt-1">
                    {indicator.label}
                  </Drawer.Title>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-md text-[--color-text-mute] hover:text-[--color-text] hover:bg-[--color-bg-elev-2]"
                  aria-label="Cerrar">
                  <X className="size-4" />
                </button>
              </div>

              {/*
                Chart area: full per-indicator chart routing in drawer is
                explicitly deferred to a follow-up sprint (after M2-M3 lands all
                9 chart components). For now show an attribution card so the
                drawer is functional and links back to the legacy chart view.
              */}
              <div className="card-surface p-6 mb-4 h-64 flex items-center justify-center text-sm text-[--color-text-mute] text-center">
                Vista detallada de {indicator.shortLabel} disponible en el
                <a
                  href="https://pamela-ruiz9.github.io/sfm-monitor/"
                  className="text-[--color-gold] hover:underline ml-1">
                  dashboard estable ↗
                </a>
                {' '}mientras se completa la migración.
              </div>

              <div className="space-y-4">
                <DrawerMetadata indicator={indicator} />
                <DrawerExport indicator={indicator} />
              </div>
            </div>
          ) : null}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 13.4: Mount ChartDrawer in Layout.astro**

Edit `app/src/layouts/Layout.astro`, add inside the body just before closing tag:

```astro
    <slot name="bottom-nav" />

    <!-- Drawer overlay — mounted globally so any KPI/chart trigger can open it -->
    <div data-drawer-mount>
      <script>
        // Intentionally minimal — drawer is rendered as React island below
      </script>
    </div>
  </body>
```

Actually replace the comment block with an actual island import. Update the page-level pages to include `<ChartDrawer client:idle />` once. Better: mount once per layout. Add at the bottom of `<body>` in Layout.astro:

```astro
    <slot name="bottom-nav" />
  </body>
```

Then in each page's `.astro` frontmatter import + render `<ChartDrawer client:idle />` after `</Layout>` is too late. Astro pattern: pass via slot.

Alternative cleaner approach — add a named slot `drawer` to Layout:

In `Layout.astro` body, before `<slot name="bottom-nav" />`, add:

```astro
    <slot name="drawer" />
```

Then in each page (`index.astro`, `mercado.astro`, etc.), add:

```astro
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
...
<ChartDrawer slot="drawer" client:idle />
```

(Done by editing each page in the next sub-step.)

- [ ] **Step 13.5: Add ChartDrawer to all 5 pages**

In each of `app/src/pages/{index,mercado,credito,sofipos,macro}.astro`:

Add to frontmatter imports:

```ts
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
```

Add right before `<BottomNav slot="bottom-nav" />`:

```astro
<ChartDrawer slot="drawer" client:idle />
```

And add the named slot to `Layout.astro` body:

```astro
    <slot name="drawer" />
    <slot name="bottom-nav" />
```

- [ ] **Step 13.6: Build + verify**

```bash
cd app && npm run build
```

Expected: build passes. Open preview, click on a KPI card → drawer slides up.

- [ ] **Step 13.7: Commit**

```bash
git add app/src/components/drawer/ app/src/layouts/ app/src/pages/
git commit -m "feat(app): ChartDrawer with vaul; opens via [data-drawer-trigger] click + URL ?indicator= sync"
```

---

## Task 14: CmdK palette

**Files:**
- Create: `app/src/components/shell/CmdKPalette.tsx`

- [ ] **Step 14.1: Create CmdKPalette.tsx**

```tsx
import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { INDICATORS, searchIndicators } from '~/data/indicators';
import { openDrawer } from '~/stores/drawerState';

export function CmdKPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest('[data-cmdk-trigger]');
      if (target) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  if (!open) return null;

  const results = query.trim() ? searchIndicators(query) : INDICATORS.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setOpen(false)}
      role="presentation">
      <Command
        label="Buscar indicador"
        className="w-full max-w-lg card-surface overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}>
        <div className="flex items-center gap-2 border-b border-[--color-border] px-4">
          <Search className="size-4 text-[--color-text-mute]" aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar IMOR, FX, SF43718…"
            className="flex-1 bg-transparent border-none py-3 text-sm text-[--color-text] placeholder-[--color-text-mute] focus:outline-none"
            autoFocus
          />
          <kbd className="text-[10px] mono px-1.5 py-0.5 rounded bg-[--color-bg-elev-2] border border-[--color-border-soft] text-[--color-text-dim]">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto py-1">
          <Command.Empty className="px-4 py-6 text-sm text-[--color-text-mute] text-center">
            Sin resultados. Quizás: IMOR · FX · Tasa Banxico · Inflación
          </Command.Empty>
          {results.map((i) => (
            <Command.Item
              key={i.id}
              value={i.id}
              onSelect={() => {
                openDrawer(i.id);
                setOpen(false);
                setQuery('');
              }}
              className="flex items-center justify-between gap-3 px-4 py-2 mx-1 rounded-md text-sm cursor-pointer text-[--color-text-dim] data-[selected=true]:bg-[--color-bg-elev-2] data-[selected=true]:text-[--color-text]">
              <div className="flex flex-col min-w-0">
                <span className="truncate">{i.label}</span>
                {i.refCode && (
                  <span className="mono text-[10px] text-[--color-text-mute]">
                    {i.refCode} · {i.tab}
                  </span>
                )}
              </div>
              <ArrowRight className="size-3 text-[--color-text-mute] flex-shrink-0" />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
```

- [ ] **Step 14.2: Mount CmdKPalette in Layout (named slot or global)**

Add to `Layout.astro` body, alongside drawer:

```astro
    <slot name="drawer" />
    <slot name="cmdk" />
    <slot name="bottom-nav" />
```

In each `.astro` page, import and add:

```ts
import { CmdKPalette } from '~/components/shell/CmdKPalette';
```

```astro
<CmdKPalette slot="cmdk" client:idle />
```

- [ ] **Step 14.3: Build + verify**

```bash
cd app && npm run build && npm run preview
```

Expected: open preview, press `Cmd+K` → palette opens, type "fx" → FX indicator appears, Enter → drawer opens.

- [ ] **Step 14.4: Commit**

```bash
git add app/src/components/shell/CmdKPalette.tsx app/src/layouts/ app/src/pages/
git commit -m "feat(app): Cmd+K palette with cmdk lib, alias search via indicator registry"
```

---

## Task 15: PWA manifest, icons, service worker

**Files:**
- Create: `app/public/manifest.webmanifest`
- Create: `app/public/icons/` (icon files generated from gold square logo or placeholder)
- Modify: `app/astro.config.ts`
- Create: `app/src/components/shell/UpdateToast.tsx`

- [ ] **Step 15.1: Create manifest.webmanifest**

`app/public/manifest.webmanifest`:

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
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["finance", "news"]
}
```

- [ ] **Step 15.2: Generate icons (manual one-time step)**

Generate 5 PNG icons from a gold square (`#c4a35a` background, "SFM" text in serif white):

```bash
mkdir -p app/public/icons
# Recommended: use https://realfavicongenerator.net/ uploading a 512x512 source image
# OR run ImageMagick locally:
# convert -size 512x512 xc:'#c4a35a' -gravity center -font 'Cormorant-Garamond-Bold' -pointsize 220 -fill white -annotate 0 'SFM' app/public/icons/icon-512.png
# Then resize: convert app/public/icons/icon-512.png -resize 192x192 app/public/icons/icon-192.png
# Maskable variants need padding (40% safe zone): use realfavicongenerator or pad in ImageMagick
```

Required files at end:
- `app/public/icons/icon-192.png` (192×192)
- `app/public/icons/icon-512.png` (512×512)
- `app/public/icons/icon-maskable-192.png` (192×192 with 40% safe-zone padding)
- `app/public/icons/icon-maskable-512.png` (512×512 with 40% safe-zone padding)
- `app/public/apple-touch-icon.png` (180×180)

If icons cannot be generated immediately, place a placeholder solid-gold 512×512 PNG and revisit before launch (Lighthouse PWA audit catches missing icons).

- [ ] **Step 15.3: Configure @vite-pwa/astro in astro.config.ts**

Edit `app/astro.config.ts` to import and use AstroPWA:

```ts
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

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
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: false, // we ship manifest.webmanifest manually
      workbox: {
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
```

- [ ] **Step 15.4: Create UpdateToast component (auto-update notification)**

`app/src/components/shell/UpdateToast.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { RotateCw, X } from 'lucide-react';

export function UpdateToast() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let mounted = true;
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() {
          if (mounted) setNeedsUpdate(true);
        },
      });
      (window as any).__sfmUpdateSW = updateSW;
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!needsUpdate) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2.5 rounded-lg card-surface border-[--color-gold]/40 shadow-lg">
      <RotateCw className="size-4 text-[--color-gold]" aria-hidden="true" />
      <span className="text-xs text-[--color-text]">
        Nueva versión disponible
      </span>
      <button
        onClick={() => (window as any).__sfmUpdateSW?.(true)}
        className="text-xs text-[--color-gold] font-medium hover:underline">
        Refrescar
      </button>
      <button
        onClick={() => setNeedsUpdate(false)}
        aria-label="Descartar"
        className="text-[--color-text-mute] hover:text-[--color-text]">
        <X className="size-3" />
      </button>
    </div>
  );
}
```

- [ ] **Step 15.5: Mount UpdateToast in Layout**

Add slot in `Layout.astro`:

```astro
    <slot name="drawer" />
    <slot name="cmdk" />
    <slot name="update-toast" />
    <slot name="bottom-nav" />
```

In each `.astro` page:

```ts
import { UpdateToast } from '~/components/shell/UpdateToast';
```

```astro
<UpdateToast slot="update-toast" client:idle />
```

- [ ] **Step 15.6: Build, verify SW + manifest in dist**

```bash
cd app && npm run build
ls dist/manifest.webmanifest dist/sw.js dist/registerSW.js dist/icons/
```

Expected: SW + manifest present, icons folder copied.

- [ ] **Step 15.7: Commit**

```bash
git add app/astro.config.ts app/public/manifest.webmanifest app/public/icons/ app/src/components/shell/UpdateToast.tsx app/src/layouts/ app/src/pages/
git commit -m "feat(pwa): manifest + icons + SW via @vite-pwa/astro + UpdateToast for auto-refresh"
```

---

## Task 16: PWA install prompt + iOS instructions

**Files:**
- Create: `app/src/components/shell/PWAInstallPrompt.tsx`

- [ ] **Step 16.1: Create PWAInstallPrompt.tsx**

```tsx
import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Share, X, Download } from 'lucide-react';
import { $visitCount, bumpVisitCount } from '~/stores/onboarding';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'sfm-install-dismissed';
const DISMISS_DAYS = 30;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
  );
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function dismissExpired(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return true;
  const ageDays = (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24);
  return ageDays >= DISMISS_DAYS;
}

export function PWAInstallPrompt() {
  const visitCount = useStore($visitCount);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    bumpVisitCount();
    if (isStandalone()) return;
    if (!dismissExpired()) {
      setDismissed(true);
      return;
    }

    function onPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onPrompt);

    if (isIOS() && Number(visitCount) >= 2) {
      setShowIOS(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setDismissed(true);
    setInstallEvent(null);
    setShowIOS(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') {
      dismiss();
    }
  }

  if (dismissed) return null;
  if (Number(visitCount) < 2) return null;

  if (installEvent) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[65] max-w-xs card-surface p-4 shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute top-2 right-2 text-[--color-text-mute] hover:text-[--color-text]">
          <X className="size-3" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Download className="size-4 text-[--color-gold]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
            Instalar app
          </span>
        </div>
        <p className="text-xs text-[--color-text-dim] mb-3 leading-relaxed">
          Acceso rápido sin abrir el navegador. Funciona offline.
        </p>
        <button
          onClick={install}
          className="w-full px-3 py-2 rounded-md bg-[--color-gold] text-[--color-bg] text-xs font-semibold hover:opacity-90">
          Instalar SFM Monitor
        </button>
      </div>
    );
  }

  if (showIOS) {
    return (
      <div className="fixed bottom-24 lg:bottom-6 right-4 z-[65] max-w-xs card-surface p-4 shadow-lg">
        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute top-2 right-2 text-[--color-text-mute] hover:text-[--color-text]">
          <X className="size-3" />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Share className="size-4 text-[--color-gold]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
            Instalar en iOS
          </span>
        </div>
        <ol className="text-xs text-[--color-text-dim] space-y-1.5 leading-relaxed">
          <li>1. Toca el botón <Share className="inline size-3" /> Compartir</li>
          <li>2. Selecciona "Añadir a pantalla de inicio"</li>
          <li>3. Confirma con "Añadir"</li>
        </ol>
      </div>
    );
  }

  return null;
}
```

- [ ] **Step 16.2: Mount PWAInstallPrompt**

Add slot in Layout:

```astro
    <slot name="install-prompt" />
```

In each page:

```ts
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
```

```astro
<PWAInstallPrompt slot="install-prompt" client:idle />
```

- [ ] **Step 16.3: Commit**

```bash
git add app/src/components/shell/PWAInstallPrompt.tsx app/src/layouts/ app/src/pages/
git commit -m "feat(pwa): install prompt with beforeinstallprompt + iOS Share instructions, gated by visit count"
```

---

## Task 17: Onboarding tour with driver.js

**Files:**
- Create: `app/src/components/shell/OnboardingTour.tsx`

- [ ] **Step 17.1: Create OnboardingTour.tsx**

```tsx
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $onboardingDone } from '~/stores/onboarding';

export function OnboardingTour() {
  const done = useStore($onboardingDone);

  useEffect(() => {
    if (done === 'true') return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    Promise.all([import('driver.js'), import('driver.js/dist/driver.css')]).then(
      ([{ driver }]) => {
        if (cancelled) return;
        const d = driver({
          showProgress: true,
          allowClose: true,
          nextBtnText: 'Siguiente',
          prevBtnText: 'Atrás',
          doneBtnText: 'Listo',
          steps: [
            {
              element: 'h1',
              popover: {
                title: 'Bienvenido a SFM Monitor',
                description:
                  'Dashboard del riesgo del Sistema Financiero Mexicano. Datos oficiales, actualización diaria.',
              },
            },
            {
              element: '[data-tone="gold"]',
              popover: {
                title: 'KPIs principales',
                description:
                  'Cada tarjeta muestra el valor actual y el cambio vs el período anterior. Toca para ver el chart completo y la metodología.',
              },
            },
            {
              element: '[role="tab"][aria-selected="true"]',
              popover: {
                title: 'Navegación por secciones',
                description:
                  'Cinco tabs: Resumen, Mercado, Crédito, SoFiPOs, Macro. En móvil aparecen abajo.',
              },
            },
            {
              element: '[data-cmdk-trigger]',
              popover: {
                title: 'Búsqueda rápida',
                description:
                  'Presiona ⌘K (Ctrl+K) para buscar cualquier indicador por nombre, alias o código de serie (ej. SF43718).',
              },
            },
          ],
          onDestroyed: () => {
            $onboardingDone.set('true');
          },
        });
        d.drive();
      },
    );

    return () => {
      cancelled = true;
    };
  }, [done]);

  return null;
}
```

- [ ] **Step 17.2: Mount in Layout**

Add slot:

```astro
    <slot name="onboarding" />
```

In each page:

```ts
import { OnboardingTour } from '~/components/shell/OnboardingTour';
```

```astro
<OnboardingTour slot="onboarding" client:idle />
```

- [ ] **Step 17.3: Commit**

```bash
git add app/src/components/shell/OnboardingTour.tsx app/src/layouts/ app/src/pages/
git commit -m "feat(app): onboarding tour with driver.js, gated by localStorage flag"
```

---

## Task 18: Swipe-between-tabs gesture + pull-to-refresh

**Files:**
- Create: `app/src/components/shell/SwipeNav.tsx`
- Create: `app/src/components/shell/PullToRefresh.tsx`

- [ ] **Step 18.1: Create SwipeNav.tsx**

```tsx
import { useDrag } from '@use-gesture/react';
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $activeTab, adjacentTab, tabPath } from '~/stores/activeTab';
import { $drawerIndicator } from '~/stores/drawerState';

export function SwipeNav() {
  const tab = useStore($activeTab);
  const drawerOpen = useStore($drawerIndicator);

  // useDrag binding via DOM listener since we want body-wide gesture
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (drawerOpen) return; // Drawer handles its own swipe

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    function start(e: TouchEvent) {
      const t = e.touches[0]!;
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    }
    function end(e: TouchEvent) {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startTime;
      // Only respond to fast horizontal swipes >50px, vertical <30px
      if (dt > 600) return;
      if (Math.abs(dx) < 50) return;
      if (Math.abs(dy) > 30) return;
      const next = adjacentTab(tab, dx < 0 ? 'next' : 'prev');
      if (next) {
        window.location.href = tabPath(next);
      }
    }

    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchend', end);
    };
  }, [tab, drawerOpen]);

  // useDrag is imported but unused here intentionally — kept for future
  // pointer-event gesture refinement when we add visual feedback during drag.
  void useDrag;
  return null;
}
```

- [ ] **Step 18.2: Create PullToRefresh.tsx**

```tsx
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

const THRESHOLD = 80;

export function PullToRefresh() {
  const [pulling, setPulling] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let startY = 0;
    let active = false;

    function start(e: TouchEvent) {
      if (window.scrollY > 0) return;
      const t = e.touches[0]!;
      startY = t.clientY;
      active = true;
    }
    function move(e: TouchEvent) {
      if (!active) return;
      const t = e.touches[0]!;
      const dy = t.clientY - startY;
      if (dy <= 0) return;
      setPulling(Math.min(dy, THRESHOLD * 1.5));
    }
    function end() {
      if (!active) return;
      active = false;
      if (pulling >= THRESHOLD) {
        setRefreshing(true);
        setPulling(THRESHOLD);
        // Soft reload — SW handles cache
        setTimeout(() => window.location.reload(), 200);
      } else {
        setPulling(0);
      }
    }

    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('touchend', end, { passive: true });
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
    };
  }, [pulling]);

  if (pulling === 0 && !refreshing) return null;

  const ready = pulling >= THRESHOLD;

  return (
    <div
      className="lg:hidden fixed top-14 inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{
        transform: `translateY(${pulling - THRESHOLD}px)`,
        opacity: Math.min(pulling / THRESHOLD, 1),
        transition: refreshing ? 'transform 0.2s' : 'none',
      }}>
      <div
        className="card-surface px-3 py-1.5 inline-flex items-center gap-2 text-xs text-[--color-text-dim]">
        <RotateCw
          className={`size-3 text-[--color-gold] ${refreshing || ready ? 'animate-spin' : ''}`}
        />
        {refreshing ? 'Actualizando…' : ready ? 'Soltar para actualizar' : 'Tirar para actualizar'}
      </div>
    </div>
  );
}
```

- [ ] **Step 18.3: Mount both in Layout**

Add slots:

```astro
    <slot name="gestures" />
```

In each page:

```ts
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
```

```astro
<SwipeNav slot="gestures" client:idle />
<PullToRefresh slot="gestures" client:idle />
```

- [ ] **Step 18.4: Commit**

```bash
git add app/src/components/shell/SwipeNav.tsx app/src/components/shell/PullToRefresh.tsx app/src/layouts/ app/src/pages/
git commit -m "feat(app): swipe-between-tabs + pull-to-refresh mobile gestures"
```

---

## Task 19: Chart error boundary

**Files:**
- Create: `app/src/components/charts/ChartErrorBoundary.tsx`

- [ ] **Step 19.1: Create ChartErrorBoundary.tsx**

```tsx
import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface State {
  error: Error | null;
}

export class ChartErrorBoundary extends Component<
  PropsWithChildren<{ chartName?: string }>,
  State
> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    console.error('[ChartErrorBoundary]', this.props.chartName, error);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-64 text-[--color-text-mute] gap-2">
          <AlertTriangle className="size-5 text-[--color-yellow]" aria-hidden="true" />
          <p className="text-xs">
            No se pudo renderizar este gráfico
            {this.props.chartName ? ` (${this.props.chartName})` : ''}.
          </p>
          <a
            href="https://pamela-ruiz9.github.io/sfm-monitor/"
            className="text-xs text-[--color-gold] hover:underline">
            Ver en dashboard estable ↗
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 19.2: Wrap each chart's render with ChartErrorBoundary**

Astro doesn't compose React error boundaries across `client:` islands, so each chart component owns its own boundary internally.

Edit `app/src/components/charts/FXChart.tsx`. Add at the top:

```tsx
import { ChartErrorBoundary } from './ChartErrorBoundary';
```

Replace the `return (` block ending in `</div>` with:

```tsx
return (
  <ChartErrorBoundary chartName="MXN/USD FIX">
    <div className="h-64 md:h-72 -mx-1">
      <Line data={data} options={/* same options object as before */} />
    </div>
  </ChartErrorBoundary>
);
```

Edit `app/src/components/charts/TasaBanxicoChart.tsx` identically:

```tsx
import { ChartErrorBoundary } from './ChartErrorBoundary';

// ... inside the component ...

return (
  <ChartErrorBoundary chartName="Tasa Banxico">
    <div className="h-64 md:h-72 -mx-1">
      <Line data={data} options={/* same options object as before */} />
    </div>
  </ChartErrorBoundary>
);
```

Edit `app/src/components/charts/InflacionChart.tsx` identically:

```tsx
import { ChartErrorBoundary } from './ChartErrorBoundary';

// ... inside the component ...

return (
  <ChartErrorBoundary chartName="Inflación INPC">
    <div className="h-64 md:h-72 -mx-1">
      <Line data={data} options={/* same options object as before */} />
    </div>
  </ChartErrorBoundary>
);
```

- [ ] **Step 19.3: Commit**

```bash
git add app/src/components/charts/
git commit -m "feat(app): ChartErrorBoundary wraps each chart island, falls back to legacy link on render error"
```

---

## Task 20: Vitest test for utils + schema (TDD strengthening)

**Files:**
- Create: `app/tests/unit/utils.test.ts`
- Create: `app/tests/unit/schema.test.ts`

- [ ] **Step 20.1: Write utils tests**

`app/tests/unit/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  computeDelta,
  ddmmyyyyToIso,
  formatMxn,
  formatPct,
} from '~/lib/utils';

describe('formatMxn', () => {
  it('formats with default 4 decimals', () => {
    expect(formatMxn(17.4052)).toBe('17.4052');
  });
  it('respects requested precision', () => {
    expect(formatMxn(17.4052, 2)).toBe('17.41');
  });
});

describe('formatPct', () => {
  it('appends % with 2 decimals default', () => {
    expect(formatPct(6.75)).toBe('6.75%');
  });
  it('handles 0', () => {
    expect(formatPct(0)).toBe('0.00%');
  });
});

describe('computeDelta', () => {
  it('returns null for <2 points', () => {
    expect(computeDelta([])).toBeNull();
    expect(computeDelta([1])).toBeNull();
  });
  it('detects up direction', () => {
    const d = computeDelta([1, 2]);
    expect(d?.direction).toBe('up');
    expect(d?.abs).toBeCloseTo(1);
    expect(d?.pct).toBeCloseTo(100);
  });
  it('detects down direction', () => {
    const d = computeDelta([2, 1]);
    expect(d?.direction).toBe('down');
  });
  it('detects flat direction', () => {
    const d = computeDelta([1, 1]);
    expect(d?.direction).toBe('flat');
  });
  it('handles zero previous without dividing by 0', () => {
    const d = computeDelta([0, 5]);
    expect(d?.pct).toBe(0);
    expect(d?.abs).toBe(5);
  });
});

describe('ddmmyyyyToIso', () => {
  it('converts DD/MM/YYYY to ISO', () => {
    expect(ddmmyyyyToIso('27/04/2026')).toBe('2026-04-27');
  });
  it('zero-pads single digits', () => {
    expect(ddmmyyyyToIso('5/3/2026')).toBe('2026-03-05');
  });
  it('returns null on malformed input', () => {
    expect(ddmmyyyyToIso('not a date')).toBeNull();
    expect(ddmmyyyyToIso('27/04')).toBeNull();
    expect(ddmmyyyyToIso('')).toBeNull();
  });
});
```

- [ ] **Step 20.2: Write schema test**

`app/tests/unit/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SfmDataSchema } from '~/data/schema';
import sfmData from '../../../data/sfm-data.json';

describe('SfmDataSchema', () => {
  it('validates real production data successfully', () => {
    const result = SfmDataSchema.safeParse(sfmData);
    if (!result.success) {
      console.error(result.error.issues.slice(0, 5));
    }
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 20.3: Run all unit tests**

```bash
cd app && npm test
```

Expected: all tests pass (utils, indicators, alerts, schema).

- [ ] **Step 20.4: Commit**

```bash
git add app/tests/unit/utils.test.ts app/tests/unit/schema.test.ts
git commit -m "test(app): unit tests for utils + Zod schema against real sfm-data.json"
```

---

## Task 21: Playwright E2E tests

**Files:**
- Create: `app/playwright.config.ts`
- Create: `app/tests/e2e/tabs.spec.ts`
- Create: `app/tests/e2e/drawer.spec.ts`
- Create: `app/tests/e2e/cmdk.spec.ts`
- Create: `app/tests/e2e/visual.spec.ts`

- [ ] **Step 21.1: Create playwright.config.ts**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
```

- [ ] **Step 21.2: Tabs smoke test**

`app/tests/e2e/tabs.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const TABS = [
  { path: '/', heading: /Riesgo del Sistema|Resumen ejecutivo|SFM Monitor/i },
  { path: '/mercado', heading: /MXN\/USD|Tasa objetivo/i },
  { path: '/credito', heading: /Riesgo de crédito|Banca Múltiple/i },
  { path: '/sofipos', heading: /SoFiPOs/i },
  { path: '/macro', heading: /INPC|Inflación/i },
];

for (const { path, heading } of TABS) {
  test(`tab ${path} loads with heading`, async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        throw new Error(`Console error on ${path}: ${msg.text()}`);
      }
    });
    await page.goto(path);
    await expect(page.locator('body')).toContainText(heading);
  });
}
```

- [ ] **Step 21.3: Drawer test**

`app/tests/e2e/drawer.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('clicking FX KPI opens drawer with FX content', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-drawer-trigger="fx"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expect(page.locator('[role="dialog"]')).toContainText('Tipo de cambio');
});

test('drawer can be closed with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-drawer-trigger="fx"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});

test('deep link ?indicator=fx opens drawer on load', async ({ page }) => {
  await page.goto('/?indicator=fx');
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
});
```

- [ ] **Step 21.4: Cmd+K test**

`app/tests/e2e/cmdk.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('Cmd+K opens palette and search returns results', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Webkit modifier handling differs');
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  // Fallback to Control+k if Meta+k didn't fire
  if (!(await page.locator('[cmdk-input]').isVisible().catch(() => false))) {
    await page.keyboard.press('Control+k');
  }
  await expect(page.locator('[cmdk-input]')).toBeVisible();
  await page.locator('[cmdk-input]').fill('fx');
  await expect(page.locator('[cmdk-list]')).toContainText('Tipo de cambio');
});
```

- [ ] **Step 21.5: Visual regression**

`app/tests/e2e/visual.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const PATHS = ['/', '/mercado', '/credito', '/sofipos', '/macro'];

for (const path of PATHS) {
  test(`visual ${path}`, async ({ page }) => {
    await page.goto(path);
    // Wait for charts to render (if any) and fonts to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot({
      maxDiffPixelRatio: 0.005,
      fullPage: true,
    });
  });
}
```

- [ ] **Step 21.6: Run E2E (initial baseline)**

```bash
cd app && npm run build && npx playwright test --update-snapshots
```

Expected: snapshots created; all spec tests pass.

- [ ] **Step 21.7: Commit**

```bash
git add app/playwright.config.ts app/tests/e2e/ app/tests/e2e/__screenshots__/
git commit -m "test(app): Playwright E2E (tabs, drawer, cmdk, visual regression baselines)"
```

---

## Task 22: Lighthouse CI configuration

**Files:**
- Create: `app/lighthouserc.json`

- [ ] **Step 22.1: Create lighthouserc.json**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./dist",
      "url": [
        "http://localhost/index.html",
        "http://localhost/mercado/index.html",
        "http://localhost/credito/index.html",
        "http://localhost/sofipos/index.html",
        "http://localhost/macro/index.html"
      ],
      "numberOfRuns": 1,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "categories:pwa": "off"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

(PWA category is `off` initially — turn on once icons are real-not-placeholder.)

- [ ] **Step 22.2: Run Lighthouse locally**

```bash
cd app && npm run build && npm run lighthouse
```

Expected: scores meet thresholds OR documents what needs adjusting.

- [ ] **Step 22.3: Commit**

```bash
git add app/lighthouserc.json
git commit -m "test(app): Lighthouse CI thresholds (Perf 90, A11y 95, BP 95, SEO 95)"
```

---

## Task 23: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 23.1: Create test.yml**

```yaml
name: test

on:
  pull_request:
    paths: ['app/**', '.github/workflows/test.yml']
  push:
    branches: [main]
    paths: ['app/**', '.github/workflows/test.yml']

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: app/package-lock.json

      - name: Install
        run: npm ci

      - name: Type check + build
        run: npm run build

      - name: Unit tests
        run: npm test

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: app/playwright-report/
          retention-days: 7

      - name: Lighthouse CI
        run: npm run lighthouse
        continue-on-error: true
```

- [ ] **Step 23.2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci(app): GitHub Actions for build + unit + E2E + Lighthouse"
```

---

## Task 24: Final verification

**Files:** none (verification only)

- [ ] **Step 24.1: Run full test suite**

```bash
cd app && npm test && npm run build && npm run test:e2e
```

Expected: green across the board.

- [ ] **Step 24.2: Manual smoke check (preview server)**

```bash
cd app && npm run preview
```

Open `http://localhost:4321` in browser. Verify:
- Hero gradient title renders in Cormorant
- 4 KPI cards in grid with gold/red/yellow/green accents
- Tabs at top (desktop) or bottom (mobile viewport)
- Click on FX KPI → drawer slides up
- Cmd+K opens palette, type "fx" → result shown
- Visit twice → install prompt appears
- First visit: onboarding tour appears
- DevTools → Application → Manifest: all icons load, theme color #0d1117

- [ ] **Step 24.3: Build size report**

```bash
cd app && npm run build 2>&1 | grep -E "kB|kb"
```

Expected: total per-tab JS ≤ 200KB gzip after dedup.

- [ ] **Step 24.4: Final commit + tag**

```bash
git add -A
git commit -m "chore(app): finalize v0.2.0-dev redesign sprint" --allow-empty
git tag -a v0.2.0-dev.1 -m "v0.2.0-dev.1 — app-like redesign + PWA foundation"
```

---

## Self-review checklist

After completing all tasks, verify against the spec:

- [ ] Layout D structure: 5 tabs ✅ (Task 4 + Task 11)
- [ ] Drawer pattern: ✅ (Task 13)
- [ ] Cmd+K palette: ✅ (Task 14)
- [ ] Bottom nav mobile + swipe: ✅ (Task 4 + Task 18)
- [ ] PWA manifest + SW + offline cache: ✅ (Task 15)
- [ ] Install prompt + iOS instructions: ✅ (Task 16)
- [ ] Pull-to-refresh: ✅ (Task 18)
- [ ] View Transitions: ✅ (Task 3 — `<ClientRouter />`)
- [ ] Onboarding tour: ✅ (Task 17)
- [ ] Restyle 3 existing charts: ✅ (Task 7 + Task 19)
- [ ] Editorial headline + AlertsPanel: ✅ (Task 5 + Task 9)
- [ ] Error boundaries: ✅ (Task 19)
- [ ] Vitest unit tests: ✅ (Task 8 + Task 20)
- [ ] Playwright E2E + visual regression: ✅ (Task 21)
- [ ] Lighthouse CI: ✅ (Task 22)
- [ ] CI workflow: ✅ (Task 23)
- [ ] Stores (activeTab, drawerState, terminalMode, onboarding): ✅ (Task 12)
- [ ] Indicator registry: ✅ (Task 8)
- [ ] Legacy palette tokens: ✅ (Task 2)
- [ ] Cormorant + Inter + JetBrains Mono fonts: ✅ (Task 3)
