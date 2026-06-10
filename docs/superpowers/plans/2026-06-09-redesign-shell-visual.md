# SFM Monitor — Redesign Shell + Visual Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top tab bar with a collapsible desktop sidebar, animate the ECG logo, rebuild the footer with 3-column layout + social links, and polish KpiCard/HeroScore typography — without touching data, charts, or business logic.

**Architecture:** New `Sidebar.astro` (server-rendered active-link detection) embeds `SidebarToggle.tsx` (React island) that reads/writes `$sidebarCollapsed` persistentAtom. `Layout.astro` restructures to a CSS grid on desktop: sidebar column | main+footer column. All 5 pages drop their `TabBar` import — the sidebar is Layout-owned, not page-owned.

**Tech Stack:** Astro 5, React 19, Tailwind v4 (`(--color-x)` CSS var syntax), nanostores + @nanostores/persistent, Lucide React (already installed), TypeScript strict

---

## File map

| File | Action |
|---|---|
| `app/src/components/shell/SfmLogo.astro` | Add CSS animation to ECG path |
| `app/src/stores/sidebarState.ts` | New — `$sidebarCollapsed` persistentAtom |
| `app/src/components/shell/SidebarToggle.tsx` | New — React island for collapse toggle |
| `app/src/components/shell/Sidebar.astro` | New — desktop nav, replaces TabBar |
| `app/src/layouts/Layout.astro` | Grid restructure, import Sidebar + Footer |
| `app/src/components/shell/TabBar.astro` | Delete |
| `app/src/components/shell/Header.astro` | Add `lg:hidden` wrapper |
| `app/src/components/kpi/KpiCard.tsx` | 3 typography/spacing tweaks |
| `app/src/components/HeroScore.astro` | Remove pills + descriptive copy |
| `app/src/components/Footer.astro` | Rebuild: 3-column, design tokens, social links |
| `app/src/pages/metodologia.astro` | Add "Sobre el proyecto" section at top |
| `app/src/pages/{index,riesgo,instituciones,macro,metodologia}.astro` | Remove TabBar import + slot usage |
| `app/tests/unit/sidebarState.test.ts` | New — unit test for nanostore |

---

### Task 1: Animate SfmLogo ECG pulse

**Files:**
- Modify: `app/src/components/shell/SfmLogo.astro`

The ECG path is the one with `d="M9 28 H18 L21.5 19.5 L26.5 37.5 L30 24 L32.5 28 H47"`. The animation draws the stroke from left to right and back, looping every 2.6s. Uses `stroke-dasharray` / `stroke-dashoffset` technique. Respects `prefers-reduced-motion`.

- [ ] **Step 1: Add `sfm-logo__pulse` class to the ECG path**

In `app/src/components/shell/SfmLogo.astro`, find the `<path>` element with the ECG stroke and add `class="sfm-logo__pulse"`:

```astro
<path
  class="sfm-logo__pulse"
  d="M9 28 H18 L21.5 19.5 L26.5 37.5 L30 24 L32.5 28 H47"
  fill="none"
  stroke="currentColor"
  stroke-width="3.2"
  stroke-linecap="round"
  stroke-linejoin="round"
/>
```

- [ ] **Step 2: Add animation CSS to the `<style>` block**

In the same file, add to the existing `<style>` block:

```css
@media (prefers-reduced-motion: no-preference) {
  .sfm-logo__pulse {
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    animation: sfm-draw 2.6s ease-in-out infinite;
  }
}
@keyframes sfm-draw {
  0%   { stroke-dashoffset: 60; }
  45%  { stroke-dashoffset: 0; }
  75%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -60; }
}
```

- [ ] **Step 3: Build to verify no type errors**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds (no output on stderr).

- [ ] **Step 4: Commit**

```bash
git add app/src/components/shell/SfmLogo.astro
git commit -m "feat(app): logo — anima pulso ECG con stroke-dashoffset"
```

---

### Task 2: Create sidebarState nanostore

**Files:**
- Create: `app/src/stores/sidebarState.ts`
- Create: `app/tests/unit/sidebarState.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/tests/unit/sidebarState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { $sidebarCollapsed } from '~/stores/sidebarState';

describe('$sidebarCollapsed', () => {
  it('exposes get and set methods', () => {
    expect(typeof $sidebarCollapsed.get).toBe('function');
    expect(typeof $sidebarCollapsed.set).toBe('function');
  });

  it('stores boolean values', () => {
    $sidebarCollapsed.set(true);
    expect($sidebarCollapsed.get()).toBe(true);
    $sidebarCollapsed.set(false);
    expect($sidebarCollapsed.get()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run test -- --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '~/stores/sidebarState'"

- [ ] **Step 3: Create the nanostore**

Create `app/src/stores/sidebarState.ts`:

```ts
import { persistentAtom } from '@nanostores/persistent';

export const $sidebarCollapsed = persistentAtom<boolean>('sfm-sidebar-collapsed', false, {
  encode: JSON.stringify,
  decode: JSON.parse,
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run test -- --reporter=verbose 2>&1 | tail -20
```

Expected: PASS — `$sidebarCollapsed` suite passes.

- [ ] **Step 5: Commit**

```bash
git add app/src/stores/sidebarState.ts app/tests/unit/sidebarState.test.ts
git commit -m "feat(app): sidebarState — nanostore persistente para colapso de sidebar"
```

---

### Task 3: Build SidebarToggle.tsx

**Files:**
- Create: `app/src/components/shell/SidebarToggle.tsx`

This React island reads `$sidebarCollapsed`, renders a chevron button, and on click updates both the store and two DOM attributes: `data-collapsed` on `#app-shell` (controls grid width) and `data-collapsed` on `[data-sidebar]` (controls label visibility inside the sidebar).

- [ ] **Step 1: Create the component**

Create `app/src/components/shell/SidebarToggle.tsx`:

```tsx
import { useStore } from '@nanostores/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { $sidebarCollapsed } from '~/stores/sidebarState';

export function SidebarToggle() {
  const collapsed = useStore($sidebarCollapsed);

  useEffect(() => {
    const shell = document.getElementById('app-shell');
    const sidebar = document.querySelector<HTMLElement>('[data-sidebar]');
    const val = String(collapsed);
    shell?.setAttribute('data-collapsed', val);
    sidebar?.setAttribute('data-collapsed', val);
  }, [collapsed]);

  return (
    <button
      type="button"
      onClick={() => $sidebarCollapsed.set(!collapsed)}
      aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      className="flex items-center justify-center size-7 rounded-md text-(--color-text-mute) hover:text-(--color-text) hover:bg-(--color-bg-elev-2) transition-colors focus-visible:outline-2 focus-visible:outline-(--color-accent)"
    >
      {collapsed
        ? <ChevronRight className="size-4" aria-hidden="true" />
        : <ChevronLeft className="size-4" aria-hidden="true" />
      }
    </button>
  );
}
```

- [ ] **Step 2: Build to verify types**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/shell/SidebarToggle.tsx
git commit -m "feat(app): SidebarToggle — isla React para colapsar/expandir sidebar"
```

---

### Task 4: Build Sidebar.astro

**Files:**
- Create: `app/src/components/shell/Sidebar.astro`

Server-rendered nav with active-link detection via `Astro.url.pathname`. Embeds `SidebarToggle` as `client:load` island. CSS in `<style>` handles label visibility based on `data-collapsed` attribute.

- [ ] **Step 1: Create Sidebar.astro**

Create `app/src/components/shell/Sidebar.astro`:

```astro
---
import { Home, Thermometer, Building2, TrendingUp, BookOpen } from 'lucide-react';
import SfmLogo from '~/components/shell/SfmLogo.astro';
import { SidebarToggle } from '~/components/shell/SidebarToggle';
import { DataFreshnessBadge } from '~/components/DataFreshnessBadge';
import { loadSfmData } from '~/data/loader';

const data = loadSfmData();
const lastUpdated = data.ultima_actualizacion;

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const path = Astro.url.pathname;

const TABS = [
  {
    href: `${base}/`,
    label: 'Resumen',
    sub: 'FX · Tasas',
    match: new RegExp(`^${base}\\/?$`),
    Icon: Home,
  },
  {
    href: `${base}/riesgo`,
    label: 'Riesgo Sistémico',
    sub: 'Heatmap',
    match: new RegExp(`^${base}/riesgo`),
    Icon: Thermometer,
  },
  {
    href: `${base}/instituciones`,
    label: 'Instituciones',
    sub: 'Banca · SoFiPOs',
    match: new RegExp(`^${base}/instituciones`),
    Icon: Building2,
  },
  {
    href: `${base}/macro`,
    label: 'Macro',
    sub: 'PIB · IGAE',
    match: new RegExp(`^${base}/macro`),
    Icon: TrendingUp,
  },
  {
    href: `${base}/metodologia`,
    label: 'Metodología',
    sub: undefined,
    match: new RegExp(`^${base}/metodologia`),
    Icon: BookOpen,
  },
] as const;
---

<aside
  data-sidebar
  data-collapsed="false"
  class="sidebar flex flex-col border-r border-(--color-border) sticky top-0 h-screen overflow-y-auto overflow-x-hidden bg-(--color-bg)"
>
  <!-- Logo row + toggle -->
  <div class="sidebar-header flex items-center justify-between gap-2 px-3 py-4 border-b border-(--color-border)">
    <a
      href={`${base}/`}
      data-astro-prefetch
      class="sidebar-logo-full min-w-0 overflow-hidden"
      aria-label="SFM Monitor — inicio"
    >
      <SfmLogo variant="horizontal" size="md" showSubtitle />
    </a>
    <a
      href={`${base}/`}
      data-astro-prefetch
      class="sidebar-logo-icon hidden"
      aria-label="SFM Monitor — inicio"
    >
      <SfmLogo variant="icon" size="sm" />
    </a>
    <SidebarToggle client:load />
  </div>

  <!-- Project description -->
  <div class="sidebar-desc px-4 py-3 border-b border-(--color-border-soft)">
    <p class="text-[11px] text-(--color-text-mute) leading-relaxed">
      Indicadores de riesgo del sistema financiero mexicano. Datos de Banxico SIE, CNBV e INEGI.
    </p>
    <a
      href={`${base}/metodologia`}
      class="text-[11px] text-(--color-accent) hover:underline mt-1 inline-block"
      data-astro-prefetch
    >
      Metodología →
    </a>
  </div>

  <!-- Nav links -->
  <nav aria-label="Secciones del dashboard" class="flex-1 py-2">
    {
      TABS.map(({ href, label, sub, match, Icon }) => {
        const active = match.test(path);
        return (
          <a
            href={href}
            data-astro-prefetch
            aria-current={active ? 'page' : undefined}
            class:list={[
              'nav-link flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md transition-colors group relative',
              active
                ? 'bg-(--color-bg-elev) text-(--color-text) font-medium sidebar-active'
                : 'text-(--color-text-mute) hover:text-(--color-text) hover:bg-(--color-bg-elev)',
            ]}
            title={label}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span class="sidebar-label flex flex-col leading-tight min-w-0">
              <span class="truncate text-sm">{label}</span>
              {sub && (
                <span class="sidebar-subnav text-[10px] font-normal text-(--color-text-mute) truncate">
                  {sub}
                </span>
              )}
            </span>
          </a>
        );
      })
    }
  </nav>

  <!-- Data freshness badge at bottom -->
  <div class="sidebar-badge px-3 py-3 border-t border-(--color-border-soft)">
    <DataFreshnessBadge source="Banxico" lastUpdated={lastUpdated} client:load />
  </div>
</aside>

<style is:global>
  /* Collapsed state — controlled by SidebarToggle via data-collapsed attr */
  [data-sidebar][data-collapsed="true"] .sidebar-desc,
  [data-sidebar][data-collapsed="true"] .sidebar-label,
  [data-sidebar][data-collapsed="true"] .sidebar-badge {
    display: none;
  }

  [data-sidebar][data-collapsed="true"] .sidebar-logo-full {
    display: none;
  }
  [data-sidebar][data-collapsed="true"] .sidebar-logo-icon {
    display: block;
  }

  [data-sidebar][data-collapsed="true"] .nav-link {
    justify-content: center;
    padding-left: 0;
    padding-right: 0;
  }

  /* Active indicator — left border */
  .sidebar-active {
    border-left: 2px solid var(--color-accent);
    padding-left: calc(0.75rem - 2px);
  }

  [data-sidebar][data-collapsed="true"] .sidebar-active {
    border-left: none;
    padding-left: 0;
  }
</style>
```

- [ ] **Step 2: Build to verify no type/template errors**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/shell/Sidebar.astro
git commit -m "feat(app): Sidebar — componente de navegación colapsable con logo animado"
```

---

### Task 5: Restructure Layout.astro

**Files:**
- Modify: `app/src/layouts/Layout.astro`

Remove the `flex-col` body, add a desktop grid with `#app-shell`. Import `Sidebar` and `Footer` directly (not as slots — they belong to the shell). Add CSS for the grid column transition. Keep the `header` slot wrapped in `lg:hidden` for mobile.

- [ ] **Step 1: Update Layout.astro**

Replace the entire `<body>` block of `app/src/layouts/Layout.astro` with:

```astro
  <body class="min-h-screen pb-20 lg:pb-0">
    <!-- Mobile header only -->
    <div class="lg:hidden">
      <slot name="header" />
    </div>

    <!-- Desktop: sidebar + content grid -->
    <div
      id="app-shell"
      data-collapsed="false"
      class="lg:flex lg:min-h-screen"
    >
      <!-- Sidebar: desktop only -->
      <div class="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      <!-- Main content column -->
      <div class="flex flex-col flex-1 min-w-0">
        <main class="flex-1 w-full px-4 lg:px-8 py-6 max-w-5xl mx-auto">
          <slot />
        </main>
        <Footer />
      </div>
    </div>

    <slot name="drawer" />
    <slot name="cmdk" />
    <slot name="update-toast" />
    <slot name="install-prompt" />
    <slot name="onboarding" />
    <slot name="gestures" />
    <slot name="bottom-nav" />
    <FeedbackFAB lang="es" />
  </body>
```

And add the imports to the frontmatter (after the existing imports):

```astro
import Sidebar from '~/components/shell/Sidebar.astro';
import Footer from '~/components/Footer.astro';
```

And add a `<style is:global>` block before `</html>` for the sidebar width transition:

```astro
<style is:global>
  #app-shell > div:first-child {
    transition: width 200ms ease;
  }
  #app-shell[data-collapsed="false"] > div:first-child,
  #app-shell:not([data-collapsed]) > div:first-child {
    width: 240px;
  }
  #app-shell[data-collapsed="true"] > div:first-child {
    width: 56px;
  }
</style>
```

- [ ] **Step 2: Build to verify the new layout compiles**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds. There may be warnings about `TabBar` still being imported in pages — those are fixed in Task 6.

- [ ] **Step 3: Commit**

```bash
git add app/src/layouts/Layout.astro
git commit -m "feat(app): Layout — grid desktop con sidebar + footer integrados"
```

---

### Task 6: Remove TabBar from all pages

**Files:**
- Modify: `app/src/pages/index.astro`
- Modify: `app/src/pages/riesgo.astro`
- Modify: `app/src/pages/instituciones.astro`
- Modify: `app/src/pages/macro.astro`
- Modify: `app/src/pages/metodologia.astro`
- Delete: `app/src/components/shell/TabBar.astro`

In each page, remove two lines: the `import TabBar` line and the `<TabBar slot="header" />` usage.

- [ ] **Step 1: Remove TabBar from index.astro**

Delete this line from the frontmatter:
```
import TabBar from '~/components/shell/TabBar.astro';
```
Delete this line from the template:
```
<TabBar slot="header" />
```

- [ ] **Step 2: Remove TabBar from riesgo.astro**

Same two deletions as Step 1 (import + slot usage).

- [ ] **Step 3: Remove TabBar from instituciones.astro**

Same two deletions.

- [ ] **Step 4: Remove TabBar from macro.astro**

Same two deletions.

- [ ] **Step 5: Remove TabBar from metodologia.astro**

Same two deletions.

- [ ] **Step 6: Delete TabBar.astro**

```bash
rm app/src/components/shell/TabBar.astro
```

- [ ] **Step 7: Build to verify no broken imports**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds with no "cannot find module TabBar" errors.

- [ ] **Step 8: Commit**

```bash
git add app/src/pages/index.astro app/src/pages/riesgo.astro app/src/pages/instituciones.astro app/src/pages/macro.astro app/src/pages/metodologia.astro
git rm app/src/components/shell/TabBar.astro
git commit -m "refactor(app): elimina TabBar — navegación migrada a Sidebar"
```

---

### Task 7: Hide Header on desktop

**Files:**
- Modify: `app/src/components/shell/Header.astro`

The sidebar absorbs all desktop navigation and identity. The header only renders on mobile.

- [ ] **Step 1: Update Header.astro**

The `<header>` element in `app/src/components/shell/Header.astro` is already wrapped by the `lg:hidden` div added in Task 5 at the Layout level. However, the `DataFreshnessBadge` is currently in the Header — it has been moved to the Sidebar in Task 4. Remove it from the Header to avoid rendering it twice.

In `app/src/components/shell/Header.astro`, remove the `DataFreshnessBadge` import and its usage:

Delete from frontmatter:
```
import { DataFreshnessBadge } from '~/components/DataFreshnessBadge';
```
Delete from frontmatter:
```
const data = loadSfmData();
const lastUpdated = data.ultima_actualizacion;
```
Delete from template:
```astro
<DataFreshnessBadge
  source="Banxico"
  lastUpdated={lastUpdated}
  client:load
/>
```

Also remove the `import { loadSfmData } from '~/data/loader';` import if it's no longer used after removing the badge.

- [ ] **Step 2: Build to verify**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/shell/Header.astro
git commit -m "refactor(app): Header — quita DataFreshnessBadge (migrado a Sidebar)"
```

---

### Task 8: Polish KpiCard.tsx

**Files:**
- Modify: `app/src/components/kpi/KpiCard.tsx`

Three targeted typography/spacing changes. No logic changes.

- [ ] **Step 1: Increase value font size**

In `app/src/components/kpi/KpiCard.tsx`, find:
```tsx
'serif tabular text-[clamp(28px,6vw,38px)] font-semibold tracking-tight leading-none',
```
Replace with:
```tsx
'serif tabular text-[clamp(32px,7vw,44px)] font-semibold tracking-tight leading-none',
```

- [ ] **Step 2: Increase card padding**

Find:
```tsx
'card-surface group relative block p-5 transition-all',
```
Replace with:
```tsx
'card-surface group relative block p-6 transition-all',
```

- [ ] **Step 3: Increase label font size**

Find:
```tsx
<div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[--color-text-mute]">
```
Replace with:
```tsx
<div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[--color-text-mute]">
```

- [ ] **Step 4: Build to verify**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/kpi/KpiCard.tsx
git commit -m "feat(app): KpiCard — polish tipográfico (valor más grande, padding, label)"
```

---

### Task 9: Simplify HeroScore.astro

**Files:**
- Modify: `app/src/components/HeroScore.astro`

Remove the four dimension pills (Crédito/Macro/Mercado/Liquidez) and the descriptive copy paragraph. The sidebar now communicates that those sections exist.

- [ ] **Step 1: Remove unused variables**

In `app/src/components/HeroScore.astro`, the `pills` array, `PILL_DOT` map, and individual tone variables (`credito`, `macro`, `mercado`, `liquidez`, `tones`, `reds`, `yellows`) are still needed for the `scoreLabel`/`scoreColor` computation. Only remove the `pills` const and `PILL_DOT` map since those only fed the pills UI:

Delete from the frontmatter:
```ts
const PILL_DOT = {
  green: 'bg-(--color-green)',
  yellow: 'bg-(--color-yellow)',
  red: 'bg-(--color-red)',
} as const;

const pills = [
  { label: 'Crédito', tone: credito },
  { label: 'Mercado', tone: mercado },
  { label: 'Macro', tone: macro },
  { label: 'Liquidez', tone: liquidez },
] as const;
```

- [ ] **Step 2: Remove pills markup and descriptive copy from template**

In the `<section>` template, delete the descriptive `<p>` and the pills `<div>`:

Delete:
```astro
<p class="text-sm text-(--color-text-dim) max-w-3xl leading-relaxed">
  Índice compuesto basado en indicadores de crédito, mercado, macro y
  liquidez del sistema bancario mexicano. Detalle por dimensión:
</p>
<div class="flex flex-wrap gap-2 pt-1">
  {
    pills.map((p) => (
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-(--color-border) bg-(--color-bg-elev) text-xs text-(--color-text-dim)">
        <span class={`size-2 rounded-full ${PILL_DOT[p.tone]}`} aria-hidden="true" />
        {p.label}
      </span>
    ))
  }
</div>
```

The remaining template should be:

```astro
<section class="space-y-3">
  <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-gold)">
    Score Global del Sistema
  </div>
  <h1
    class="serif font-semibold leading-[1.05] tracking-tight"
    style={`font-size: clamp(2.8rem, 6vw, 4.8rem); color: ${scoreColor}`}>
    {scoreLabel}
  </h1>
  {
    alerts.length > 0 && (
      <p class="text-[11px] text-(--color-text-mute) pt-1">
        {alerts.length} {alerts.length === 1 ? 'alerta activa' : 'alertas activas'} — ver panel debajo.
      </p>
    )
  }
</section>
```

- [ ] **Step 3: Build to verify**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/HeroScore.astro
git commit -m "feat(app): HeroScore — elimina pills y copy descriptivo, hero limpio"
```

---

### Task 10: Rebuild Footer.astro

**Files:**
- Modify: `app/src/components/Footer.astro`

Replace the current 4-column layout (uses raw slate classes) with 3 columns using the design token system: left (logo + project info + credits), center (data sources), right (social links). Apply `(--color-*)` tokens throughout.

- [ ] **Step 1: Replace Footer.astro**

Overwrite `app/src/components/Footer.astro` with:

```astro
---
import SfmLogo from '~/components/shell/SfmLogo.astro';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const year = new Date().getFullYear();

const SOURCES = [
  {
    label: 'Banxico SIE',
    description: 'Sistema de Información Económica',
    href: 'https://www.banxico.org.mx/SieInternet/',
  },
  {
    label: 'CNBV',
    description: 'Comisión Nacional Bancaria y de Valores',
    href: 'https://www.cnbv.gob.mx',
  },
  {
    label: 'INEGI',
    description: 'Instituto Nacional de Estadística y Geografía',
    href: 'https://www.inegi.org.mx',
  },
] as const;

const SOCIAL = [
  {
    label: 'GitHub',
    href: 'https://github.com/Pamela-ruiz9/sfm-monitor',
    icon: 'github',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/pamela-ru%C3%ADz-512834231/',
    icon: 'linkedin',
  },
] as const;
---

<footer class="border-t border-(--color-border) bg-(--color-bg) mt-16">
  <div class="w-full px-4 lg:px-8 py-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

    <!-- Col 1: proyecto -->
    <div class="space-y-4">
      <a href={`${base}/`} aria-label="SFM Monitor — inicio">
        <SfmLogo variant="horizontal" size="sm" />
      </a>
      <p class="text-[13px] text-(--color-text-mute) leading-relaxed max-w-xs">
        Dashboard público de riesgo del Sistema Financiero Mexicano. No es producto oficial de Banxico, CNBV o INEGI. No constituye asesoría financiera.
      </p>
      <p class="text-[12px] text-(--color-text-mute)">
        Autoría: <span class="text-(--color-text-dim)">Ingrid Pamela Ruiz Puga</span>
        · Co-autoría: <span class="text-(--color-text-dim)">Artemio Padilla</span>
      </p>
      <p class="text-[11px] text-(--color-text-mute)">
        Código <a href="https://github.com/Pamela-ruiz9/sfm-monitor/blob/main/LICENSE" class="hover:text-(--color-accent) transition-colors" target="_blank" rel="noopener">MIT</a>
        · Contenido <a href="https://github.com/Pamela-ruiz9/sfm-monitor/blob/main/LICENSE-CONTENT" class="hover:text-(--color-accent) transition-colors" target="_blank" rel="noopener">CC-BY 4.0</a>
        · © {year}
      </p>
    </div>

    <!-- Col 2: fuentes -->
    <div class="space-y-3">
      <div class="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-mute)">
        Fuentes de consulta
      </div>
      <ul class="space-y-2">
        {SOURCES.map(({ label, description, href }) => (
          <li>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              class="group flex flex-col gap-0.5"
            >
              <span class="text-[13px] text-(--color-text-dim) group-hover:text-(--color-accent) transition-colors">
                {label}
              </span>
              <span class="text-[11px] text-(--color-text-mute)">
                {description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>

    <!-- Col 3: contacto -->
    <div class="space-y-3">
      <div class="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--color-text-mute)">
        Contacto
      </div>
      <ul class="space-y-2">
        {SOCIAL.map(({ label, href }) => (
          <li>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              class="text-[13px] text-(--color-text-dim) hover:text-(--color-accent) transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
        <li>
          <a
            href={`${base}/metodologia`}
            class="text-[13px] text-(--color-text-dim) hover:text-(--color-accent) transition-colors"
            data-astro-prefetch
          >
            Metodología
          </a>
        </li>
        <li>
          <a
            href="https://github.com/Pamela-ruiz9/sfm-monitor/blob/main/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[13px] text-(--color-text-dim) hover:text-(--color-accent) transition-colors"
          >
            Changelog
          </a>
        </li>
      </ul>
    </div>

  </div>
</footer>
```

- [ ] **Step 2: Build to verify**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/Footer.astro
git commit -m "feat(app): Footer — 3 columnas con fuentes, redes sociales y créditos"
```

---

### Task 11: Add "Sobre el proyecto" to metodologia.astro

**Files:**
- Modify: `app/src/pages/metodologia.astro`

Add a new section at the very top of the content area, before the `EditorialHeadline`. This section serves as the "About" page — authorship, purpose, sources, licenses.

- [ ] **Step 1: Add the section**

In `app/src/pages/metodologia.astro`, immediately after `<div class="space-y-8 max-w-3xl">` insert:

```astro
<!-- Sobre el proyecto -->
<section class="space-y-4 pb-8 border-b border-(--color-border-soft)">
  <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-accent)">
    Sobre el proyecto
  </div>
  <h2 class="serif font-semibold text-3xl text-(--color-text) leading-tight">
    SFM Monitor
  </h2>
  <p class="text-sm text-(--color-text-dim) leading-relaxed max-w-2xl">
    Dashboard público y citable de indicadores de riesgo del Sistema Financiero Mexicano.
    Consolida en un solo lugar las métricas de crédito (IMOR, IMORA, ICOR, IFRS 9),
    mercado (FX, TIIE), macro (inflación, PIB) y liquidez (reservas internacionales),
    con datos actualizados diariamente desde fuentes oficiales.
  </p>
  <p class="text-sm text-(--color-text-dim) leading-relaxed max-w-2xl">
    Dirigido a analistas financieros, investigadores, periodistas económicos y cualquier
    persona interesada en monitorear la salud del sistema bancario mexicano con información
    abierta y citable.
  </p>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
    <div class="space-y-1">
      <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute)">Autora principal</div>
      <div class="text-sm text-(--color-text)">Ingrid Pamela Ruiz Puga</div>
      <div class="text-[12px] text-(--color-text-mute)">BBVA México · Científica de datos</div>
    </div>
    <div class="space-y-1">
      <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute)">Co-autoría</div>
      <div class="text-sm text-(--color-text)">Artemio Padilla</div>
      <div class="text-[12px] text-(--color-text-mute)">Blueprint 2026 · Migración Astro</div>
    </div>
  </div>
  <div class="flex flex-wrap gap-x-6 gap-y-1 pt-1">
    <span class="text-[12px] text-(--color-text-mute)">
      Código: <a href="https://github.com/Pamela-ruiz9/sfm-monitor/blob/main/LICENSE" target="_blank" rel="noopener" class="text-(--color-accent) hover:underline">MIT</a>
    </span>
    <span class="text-[12px] text-(--color-text-mute)">
      Contenido: <a href="https://github.com/Pamela-ruiz9/sfm-monitor/blob/main/LICENSE-CONTENT" target="_blank" rel="noopener" class="text-(--color-accent) hover:underline">CC-BY 4.0</a>
    </span>
    <span class="text-[12px] text-(--color-text-mute)">
      DOI: <a href="https://doi.org/10.5281/zenodo.20370914" target="_blank" rel="noopener" class="text-(--color-accent) hover:underline">10.5281/zenodo.20370914</a>
    </span>
  </div>
</section>
```

- [ ] **Step 2: Build to verify**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/src/pages/metodologia.astro
git commit -m "feat(app): metodología — sección Sobre el proyecto con autoría y licencias"
```

---

### Task 12: Final verification + CHANGELOG

**Files:**
- Modify: `app/CHANGELOG.md` (or root `CHANGELOG.md`)

- [ ] **Step 1: Run full test suite**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run test
```

Expected: all unit tests pass (alerts, indicators, schema, utils, sidebarState).

- [ ] **Step 2: Run final build**

```bash
cd /home/pamer/projects/sfm-monitor/app && npm run build
```

Expected: zero errors, `dist/` generated.

- [ ] **Step 3: Update CHANGELOG**

In `/home/pamer/projects/sfm-monitor/CHANGELOG.md`, add under `[Sin publicar]`:

```markdown
### Added
- Sidebar de navegación colapsable en desktop (240px ↔ 56px) reemplaza TabBar
- Footer rediseñado: 3 columnas con fuentes de consulta, LinkedIn y GitHub
- Sección "Sobre el proyecto" en página Metodología
- Animación CSS del pulso ECG en logo SfmLogo (stroke-dashoffset)

### Changed
- `KpiCard`: valor numérico más grande (clamp 32-44px), padding p-6, label 11px
- `HeroScore`: sin pills de dimensión ni copy descriptivo — hero limpio
- `Layout`: grid desktop sidebar + contenido, header solo en mobile
- `Footer`: migrado a tokens de color del sistema, descripción en todas las páginas
```

- [ ] **Step 4: Final commit**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): redesign shell — sidebar, footer, hero, logo animado"
```

---

## Notes for the implementer

- **Tailwind v4 CSS var syntax**: use `(--color-x)` not `[--color-x]` in all new code. Example: `text-(--color-accent)`, not `text-[--color-accent]`.
- **Never claim visual success** without loading the app in a browser (`npm run dev`). Build passing confirms types/SSR, not visual correctness.
- **`DataFreshnessBadge` in Sidebar**: it's a React component with `client:load`. If the sidebar is on every page, the badge will load on every page automatically — this is expected.
- **Sidebar collapse on page load**: on first paint, `data-collapsed="false"` is set server-side. The `SidebarToggle` React component re-reads localStorage on `useEffect` mount and applies the correct state. There may be a brief flash if the user had previously collapsed the sidebar — this is acceptable for now.
- **`max-w-5xl mx-auto` on main**: this replaces the old `max-w-7xl`. Pages that set their own `max-w-3xl` (like metodología) are unaffected — they constrain within the already-narrower content column.
