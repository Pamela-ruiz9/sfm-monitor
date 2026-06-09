# Branding naranja — token swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar todos los usos de `--color-gold` como color de interacción/chrome por `--color-accent` (#f5793c) en 11 archivos, dejando `--color-gold` solo para semántica KPI financiera.

**Architecture:** Token swap quirúrgico — sin cambios a tokens globales ni a lógica. `--color-accent` ya existe en `global.css` desde el commit `021a0a5`. Cada tarea edita un grupo de archivos relacionados y hace un commit. Sin tests de TypeScript (son cambios de clase visual); la verificación es `npm run build` sin errores + screenshot visual del área cambiada.

**Tech Stack:** Astro 5, React 19, Tailwind v4 con CSS custom properties en `@theme`.

---

## Archivos modificados

| Archivo | Sección | Cambios |
|---|---|---|
| `app/src/components/shell/TabBar.astro` | Shell nav | `--color-gold` → `--color-accent` en estado activo (2 líneas) |
| `app/src/components/shell/BottomNav.astro` | Shell nav | `--color-gold` → `--color-accent` en estado activo (1 línea) |
| `app/src/components/kpi/KpiCard.tsx` | KPI | hover border + hover ícono (2 líneas; `VALUE_COLOR.gold` NO cambia) |
| `app/src/components/kpi/KpiHero.tsx` | KPI | hover border (1 línea; tone gold value NO cambia) |
| `app/src/pages/index.astro` | KPI | borde del KPI card activo en `<style is:global>` (1 línea) |
| `app/src/components/drawer/ChartDrawer.tsx` | Interactivo | label de sección + link (2 líneas) |
| `app/src/components/drawer/DrawerExport.tsx` | Interactivo | hover border del botón Exportar (1 línea) |
| `app/src/components/shell/UpdateToast.tsx` | Interactivo | borde + ícono + texto del botón (3 líneas) |
| `app/src/components/shell/PWAInstallPrompt.tsx` | Interactivo | iconos + labels + fondo botón instalar (5 líneas) |
| `app/src/components/shell/CmdKPalette.tsx` | Interactivo | añadir borde izquierdo accent en ítem seleccionado (1 línea modificada) |
| `app/src/pages/riesgo.astro` | Páginas | label + link externo (2 líneas) |
| `app/src/pages/metodologia.astro` | Páginas | link inline (1 línea) |

---

## Task 1: Shell de navegación — TabBar y BottomNav

**Files:**
- Modify: `app/src/components/shell/TabBar.astro:36,45`
- Modify: `app/src/components/shell/BottomNav.astro:35`

- [ ] **Step 1: Editar TabBar.astro**

  En `app/src/components/shell/TabBar.astro`, líneas 36 y 45:

  ```diff
  - ? 'text-[--color-gold] border-[--color-gold]'
  + ? 'text-[--color-accent] border-[--color-accent]'
  ```

  ```diff
  - active ? 'text-[--color-gold]/60' : 'text-[--color-text-mute]/60',
  + active ? 'text-[--color-accent]/60' : 'text-[--color-text-mute]/60',
  ```

- [ ] **Step 2: Editar BottomNav.astro**

  En `app/src/components/shell/BottomNav.astro`, línea 35:

  ```diff
  - active ? 'text-[--color-gold]' : 'text-[--color-text-mute]',
  + active ? 'text-[--color-accent]' : 'text-[--color-text-mute]',
  ```

- [ ] **Step 3: Verificar build**

  ```bash
  cd app && npm run build 2>&1 | tail -5
  ```

  Esperado: `✓ Completed` sin errores. Si hay error, es un typo en el nombre de clase — revisar los tres archivos.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/components/shell/TabBar.astro app/src/components/shell/BottomNav.astro
  git commit -m "feat(app): branding — tabs y bottom nav activos en naranja"
  ```

---

## Task 2: KPI cards — hovers (sin tocar valor semántico)

**Files:**
- Modify: `app/src/components/kpi/KpiCard.tsx:81,94`
- Modify: `app/src/components/kpi/KpiHero.tsx:43`
- Modify: `app/src/pages/index.astro:214`

> ⚠️ `KpiCard.tsx:31` y `KpiHero.tsx:16` tienen `gold: 'text-[--color-gold]'` — son semánticos, **NO los toques**.

- [ ] **Step 1: Editar KpiCard.tsx**

  En `app/src/components/kpi/KpiCard.tsx`:

  Línea 81 — hover del borde de la card:
  ```diff
  - href && 'hover:border-[--color-gold] hover:translate-y-[-1px]',
  + href && 'hover:border-[--color-accent] hover:translate-y-[-1px]',
  ```

  Línea 94 — hover del ícono:
  ```diff
  - return <Icon className="size-4 text-[--color-text-mute] group-hover:text-[--color-gold] transition-colors" aria-hidden="true" />;
  + return <Icon className="size-4 text-[--color-text-mute] group-hover:text-[--color-accent] transition-colors" aria-hidden="true" />;
  ```

- [ ] **Step 2: Editar KpiHero.tsx**

  En `app/src/components/kpi/KpiHero.tsx`, línea 43:
  ```diff
  - href && 'hover:border-[--color-gold]',
  + href && 'hover:border-[--color-accent]',
  ```

- [ ] **Step 3: Editar index.astro**

  En `app/src/pages/index.astro`, línea 214 (dentro de `<style is:global>`):
  ```diff
  - border-color: var(--color-gold);
  + border-color: var(--color-accent);
  ```

- [ ] **Step 4: Verificar build**

  ```bash
  cd app && npm run build 2>&1 | tail -5
  ```

  Esperado: `✓ Completed` sin errores.

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/components/kpi/KpiCard.tsx app/src/components/kpi/KpiHero.tsx app/src/pages/index.astro
  git commit -m "feat(app): branding — KPI card hover border e ícono en naranja"
  ```

---

## Task 3: Drawer — ChartDrawer y DrawerExport

**Files:**
- Modify: `app/src/components/drawer/ChartDrawer.tsx:49,74`
- Modify: `app/src/components/drawer/DrawerExport.tsx:14`

- [ ] **Step 1: Editar ChartDrawer.tsx**

  En `app/src/components/drawer/ChartDrawer.tsx`:

  Línea 49 — label de sección dentro del drawer:
  ```diff
  - <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-gold]">
  + <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[--color-accent]">
  ```

  Línea 74 — link "ver más":
  ```diff
  - className="text-[--color-gold] hover:underline ml-1">
  + className="text-[--color-accent] hover:underline ml-1">
  ```

- [ ] **Step 2: Editar DrawerExport.tsx**

  En `app/src/components/drawer/DrawerExport.tsx`, línea 14:
  ```diff
  - className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[--color-border] bg-[--color-bg-elev-2] text-xs text-[--color-text-dim] hover:text-[--color-text] hover:border-[--color-gold]">
  + className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[--color-border] bg-[--color-bg-elev-2] text-xs text-[--color-text-dim] hover:text-[--color-text] hover:border-[--color-accent]">
  ```

- [ ] **Step 3: Verificar build**

  ```bash
  cd app && npm run build 2>&1 | tail -5
  ```

  Esperado: `✓ Completed` sin errores.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/components/drawer/ChartDrawer.tsx app/src/components/drawer/DrawerExport.tsx
  git commit -m "feat(app): branding — drawer labels y export button en naranja"
  ```

---

## Task 4: Shell interactivo — UpdateToast, PWAInstallPrompt, CmdKPalette

**Files:**
- Modify: `app/src/components/shell/UpdateToast.tsx:28,29,35`
- Modify: `app/src/components/shell/PWAInstallPrompt.tsx:101,102,111,128,129`
- Modify: `app/src/components/shell/CmdKPalette.tsx:74`

- [ ] **Step 1: Editar UpdateToast.tsx**

  En `app/src/components/shell/UpdateToast.tsx`:

  Línea 28 — borde del toast:
  ```diff
  - <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2.5 rounded-lg card-surface border-[--color-gold]/40 shadow-lg">
  + <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-2.5 rounded-lg card-surface border-[--color-accent]/40 shadow-lg">
  ```

  Línea 29 — ícono:
  ```diff
  - <RotateCw className="size-4 text-[--color-gold]" aria-hidden="true" />
  + <RotateCw className="size-4 text-[--color-accent]" aria-hidden="true" />
  ```

  Línea 35 — texto del botón "Actualizar":
  ```diff
  - className="text-xs text-[--color-gold] font-medium hover:underline">
  + className="text-xs text-[--color-accent] font-medium hover:underline">
  ```

- [ ] **Step 2: Editar PWAInstallPrompt.tsx**

  En `app/src/components/shell/PWAInstallPrompt.tsx`, reemplaza las 5 líneas:

  Línea 101:
  ```diff
  - <Download className="size-4 text-[--color-gold]" />
  + <Download className="size-4 text-[--color-accent]" />
  ```

  Línea 102:
  ```diff
  - <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
  + <span className="text-xs font-semibold uppercase tracking-wider text-[--color-accent]">
  ```

  Línea 111 — fondo del botón "Instalar" (este cambio afecta el color de texto también porque el contraste con naranja y oscuro es bueno):
  ```diff
  - className="w-full px-3 py-2 rounded-md bg-[--color-gold] text-[--color-bg] text-xs font-semibold hover:opacity-90">
  + className="w-full px-3 py-2 rounded-md bg-[--color-accent] text-[--color-bg] text-xs font-semibold hover:opacity-90">
  ```

  Línea 128:
  ```diff
  - <Share className="size-4 text-[--color-gold]" />
  + <Share className="size-4 text-[--color-accent]" />
  ```

  Línea 129:
  ```diff
  - <span className="text-xs font-semibold uppercase tracking-wider text-[--color-gold]">
  + <span className="text-xs font-semibold uppercase tracking-wider text-[--color-accent]">
  ```

- [ ] **Step 3: Editar CmdKPalette.tsx**

  En `app/src/components/shell/CmdKPalette.tsx`, línea 74 — añadir borde izquierdo naranja en el ítem seleccionado. El padding actual es `px-4` (16px). Con el borde de 2px, usamos `data-[selected=true]:pl-[14px]` para mantener el texto alineado con los ítems no seleccionados:

  ```diff
  - className="flex items-center justify-between gap-3 px-4 py-2 mx-1 rounded-md text-sm cursor-pointer text-[--color-text-dim] data-[selected=true]:bg-[--color-bg-elev-2] data-[selected=true]:text-[--color-text]">
  + className="flex items-center justify-between gap-3 px-4 py-2 mx-1 rounded-md text-sm cursor-pointer text-[--color-text-dim] data-[selected=true]:bg-[--color-bg-elev-2] data-[selected=true]:text-[--color-text] data-[selected=true]:border-l-2 data-[selected=true]:border-[--color-accent] data-[selected=true]:pl-[14px]">
  ```

- [ ] **Step 4: Verificar build**

  ```bash
  cd app && npm run build 2>&1 | tail -5
  ```

  Esperado: `✓ Completed` sin errores.

- [ ] **Step 5: Commit**

  ```bash
  git add app/src/components/shell/UpdateToast.tsx \
          app/src/components/shell/PWAInstallPrompt.tsx \
          app/src/components/shell/CmdKPalette.tsx
  git commit -m "feat(app): branding — toast, PWA install prompt y CmdK en naranja"
  ```

---

## Task 5: Páginas — riesgo.astro y metodologia.astro

**Files:**
- Modify: `app/src/pages/riesgo.astro:92,103`
- Modify: `app/src/pages/metodologia.astro:121`

- [ ] **Step 1: Editar riesgo.astro**

  En `app/src/pages/riesgo.astro`:

  Línea 92 — label de sección:
  ```diff
  - <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--color-gold]">
  + <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--color-accent]">
  ```

  Línea 103 — link externo:
  ```diff
  - class="text-[--color-gold] hover:underline" target="_blank" rel="noopener">
  + class="text-[--color-accent] hover:underline" target="_blank" rel="noopener">
  ```

- [ ] **Step 2: Editar metodologia.astro**

  En `app/src/pages/metodologia.astro`, línea 121:
  ```diff
  - class="text-[--color-gold] hover:underline">docs/research/blueprint-2026.md</a>
  + class="text-[--color-accent] hover:underline">docs/research/blueprint-2026.md</a>
  ```

- [ ] **Step 3: Verificar build final completo**

  ```bash
  cd app && npm run build 2>&1 | grep -E "error|warning|✓|Completed"
  ```

  Esperado: `0 errors`, `✓ Completed`.

- [ ] **Step 4: Commit**

  ```bash
  git add app/src/pages/riesgo.astro app/src/pages/metodologia.astro
  git commit -m "feat(app): branding — links y labels de páginas en naranja"
  ```

---

## Task 6: Verificación visual

**Files:** ninguno (solo lectura + screenshots)

- [ ] **Step 1: Arrancar dev server**

  ```bash
  cd app && npm run dev -- --port 4399 &>/tmp/sfm-dev.log &
  sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:4399/sfm-monitor/
  ```

  Esperado: `200`

- [ ] **Step 2: Screenshot del header + tabs**

  Verificar que el tab activo y el logo son naranja, no dorado.

  ```bash
  node -e "
  const { chromium } = require('./node_modules/playwright');
  (async () => {
    const b = await chromium.launch({ executablePath: '/snap/bin/chromium', args: ['--no-sandbox','--disable-dev-shm-usage'] });
    const p = await b.newPage();
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.goto('http://localhost:4399/sfm-monitor/', { waitUntil: 'networkidle', timeout: 30000 });
    await p.screenshot({ path: '/tmp/verify-tabs.png', clip: { x:0, y:0, width:1280, height:110 } });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await p.screenshot({ path: '/tmp/verify-mobile-nav.png', clip: { x:0, y:0, width:390, height:64 } });
    await b.close();
    console.log('OK');
  })().catch(e => { console.error(e.message); process.exit(1); });
  "
  ```

- [ ] **Step 3: Revisar screenshots**

  Abrir `/tmp/verify-tabs.png` y `/tmp/verify-mobile-nav.png`. Confirmar visualmente:
  - Tab activo ("Resumen") en naranja `#f5793c`
  - Logo SFM en naranja
  - Bottom nav activo en naranja (mobile)
  - KPI card values siguen en dorado `#c4a35a`

- [ ] **Step 4: Actualizar CHANGELOG**

  En `CHANGELOG.md`, bajo `## [Sin publicar]`, añadir encima de la entrada más reciente:

  ```markdown
  ### feat(app): branding naranja — token swap consistente (2026-06-09)
  - `TabBar.astro`, `BottomNav.astro`: tab e ítem activo de navegación en `--color-accent` (#f5793c).
  - `KpiCard.tsx`, `KpiHero.tsx`: hover de borde e ícono en naranja; `tone='gold'` semántico intacto.
  - `index.astro`: borde del KPI card activo/seleccionado en naranja.
  - `ChartDrawer.tsx`, `DrawerExport.tsx`: labels y hover de botón en naranja.
  - `UpdateToast.tsx`, `PWAInstallPrompt.tsx`: chrome de toast e install prompt en naranja.
  - `CmdKPalette.tsx`: borde izquierdo naranja en ítem seleccionado.
  - `riesgo.astro`, `metodologia.astro`: labels y links inline en naranja.
  - Colores semánticos protegidos: `--color-gold` solo para valores KPI financieros.
  ```

- [ ] **Step 5: Commit final**

  ```bash
  git add CHANGELOG.md
  git commit -m "docs(changelog): branding naranja token swap completo"
  ```
