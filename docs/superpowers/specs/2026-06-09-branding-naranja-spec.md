# Spec: Branding naranja — token swap consistente

**Fecha:** 2026-06-09
**Proyecto:** SFM Monitor — Astro app (`app/`)
**Alcance:** Spec A de dos. Spec B (rediseño de inicio) es sesión separada.

---

## Contexto

El commit `021a0a5` implementó el logo SFM con acento naranja `#f5793c` y definió el token `--color-accent` en `global.css`. Sin embargo, el resto de la app usa `--color-gold` tanto para **interacción/chrome** (tabs activos, hovers, botones) como para **semántica KPI** (valor de "riesgo contenido"). Esta mezcla crea incoherencia visual: el logo es naranja pero la navegación sigue dorada.

Este spec define el token swap para que `--color-accent` (naranja) sea el color de toda interacción de chrome, y `--color-gold` quede exclusivamente para significado semántico financiero.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿Naranja en navegación? | **Sí** — tab activo, bottom nav activo |
| ¿Profundidad del cambio? | **Shell + todos los elementos interactivos** |
| Estrategia de tokens | **Token swap quirúrgico** — no se renombran tokens globales |
| Favicon de pestaña | **Transparente** (`sfm-icon.svg`, ya implementado) |
| Colores semánticos (verde/rojo/amarillo/dorado-KPI) | **Sin cambio** — protegidos |

---

## Tokens (global.css) — sin cambios

Los tokens ya están definidos desde `021a0a5`:

```css
--color-accent: #f5793c;        /* naranja señal — chrome e interacción */
--color-accent-soft: rgba(245, 121, 60, 0.15);
--color-accent-knock: #1a0a03;
--color-gold: #c4a35a;          /* dorado — semántica KPI únicamente */
```

No se añaden ni eliminan tokens.

---

## Inventario de cambios

### Sección 1 — Shell de navegación (2 archivos)

**`app/src/components/shell/TabBar.astro`**
- Tab activo: `text-[--color-gold]` → `text-[--color-accent]`
- Tab activo: `border-[--color-gold]` → `border-[--color-accent]`
- Sub-texto activo: `text-[--color-gold]/60` → `text-[--color-accent]/60`

**`app/src/components/shell/BottomNav.astro`**
- Ítem activo: `text-[--color-gold]` → `text-[--color-accent]`

### Sección 2 — KPI cards (3 archivos)

**`app/src/components/kpi/KpiCard.tsx`**
- Hover border: `hover:border-[--color-gold]` → `hover:border-[--color-accent]`
- Hover icono: `group-hover:text-[--color-gold]` → `group-hover:text-[--color-accent]`
- ⛔ `VALUE_COLOR.gold: 'text-[--color-gold]'` — **no cambia** (semántico)

**`app/src/components/kpi/KpiHero.tsx`**
- Hover border: `hover:border-[--color-gold]` → `hover:border-[--color-accent]`
- ⛔ `tone gold` value color — **no cambia** (semántico)

**`app/src/pages/index.astro`**
- Borde del KPI card activo/seleccionado: `var(--color-gold)` → `var(--color-accent)`

### Sección 3 — Elementos interactivos (5 archivos)

**`app/src/components/drawer/ChartDrawer.tsx`**
- Label de sección (línea 49): `text-[--color-gold]` → `text-[--color-accent]`
- Link "ver más" (línea 74): `text-[--color-gold]` → `text-[--color-accent]`

**`app/src/components/drawer/DrawerExport.tsx`**
- Hover border botón Exportar (línea 14): `hover:border-[--color-gold]` → `hover:border-[--color-accent]`

**`app/src/components/shell/UpdateToast.tsx`**
- Borde del toast: `border-[--color-gold]/40` → `border-[--color-accent]/40`
- Ícono RotateCw: `text-[--color-gold]` → `text-[--color-accent]`
- Texto botón "Actualizar": `text-[--color-gold]` → `text-[--color-accent]`

**`app/src/components/shell/PWAInstallPrompt.tsx`**
- Ícono Download (línea 101): `text-[--color-gold]` → `text-[--color-accent]`
- Label instalación (línea 102): `text-[--color-gold]` → `text-[--color-accent]`
- Fondo botón "Instalar" (línea 111): `bg-[--color-gold]` → `bg-[--color-accent]`
- Ícono Share (línea 128): `text-[--color-gold]` → `text-[--color-accent]`
- Label share (línea 129): `text-[--color-gold]` → `text-[--color-accent]`

**`app/src/components/shell/CmdKPalette.tsx`**
- Añadir borde izquierdo naranja en ítem seleccionado: actualmente el ítem seleccionado solo usa `bg-[--color-bg-elev-2]` sin acento de marca. Cambiar a: `data-[selected=true]:border-l-2 data-[selected=true]:border-[--color-accent] data-[selected=true]:pl-[calc(1rem-2px)]` para mantener el alineado del texto.

### Sección 4 — Páginas (2 archivos)

**`app/src/pages/riesgo.astro`**
- Label de sección (línea 92): `text-[--color-gold]` → `text-[--color-accent]`
- Link externo (línea 103): `text-[--color-gold]` → `text-[--color-accent]`

**`app/src/pages/metodologia.astro`**
- Link inline en texto (línea 121): `text-[--color-gold]` → `text-[--color-accent]`

---

## Colores semánticos protegidos — no tocar

| Elemento | Archivo | Por qué se queda dorado |
|---|---|---|
| `VALUE_COLOR.gold` | `KpiCard.tsx` | Significa "riesgo contenido" para indicadores KPI |
| `tone='gold'` value | `KpiHero.tsx` | Idem |
| `scoreColor = --color-gold` | `HeroScore.astro` | Estado editorial "Riesgo Contenido" |
| Kicker label oro | `HeroScore.astro` | Elemento editorial, no interactivo |
| `card-surface[data-tone='gold']` | `global.css` | Borde semántico de card en estado contenido |
| `FeedbackFAB` | `FeedbackFAB.astro` | Usa `primary-600` ajeno al sistema de tokens |
| Dots `AlertsPanel` | `AlertsPanel.astro` | Verde/amarillo/rojo — semáforo, no chrome |
| Series de gráficas | todos los charts | Okabe-Ito, paleta de accesibilidad — no cambia |

---

## Resumen de impacto

| Métrica | Valor |
|---|---|
| Archivos modificados | 11 |
| Cambios de clase/token | ~24 |
| Tokens nuevos en global.css | 0 |
| Riesgo de regresión | Bajo — todos son cambios de clase visual, sin lógica |
| Verificación post-implementación | `npm run build` en `app/` + screenshot header/tabs/drawer |

---

## Pendiente (Spec B)

El rediseño de la página de inicio (hero, KPI grid, sección de gráficas, densidad general) se diseña en una sesión de brainstorming separada como **Spec B: rediseño-home**.
