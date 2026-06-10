# Diseño: Instituciones — Sub-rutas y Sub-navegación en Sidebar

**Fecha:** 2026-06-09
**Alcance:** `app/src/pages/instituciones/` + `app/src/components/shell/Sidebar.astro`
**Objetivo:** Dividir la página monolítica `/instituciones` en cuatro sub-rutas independientes y reflejar su jerarquía en la sidebar con un accordion expandible.

---

## Decisión arquitectónica

La página `/instituciones` se convierte en un directorio de rutas Astro. Cada sub-sección es una página SSG independiente. La navegación entre ellas usa `data-astro-prefetch` + View Transitions para transiciones suaves sin recarga completa.

**No se usa estado JS** para controlar qué sección mostrar — cada URL es una página real. El `SectorToggle` y el `<script>` de `sfm:sector-change` se eliminan.

---

## Estructura de rutas

| URL | Archivo | Contenido |
|---|---|---|
| `/instituciones` | `instituciones/index.astro` | Redirect 301 a `/instituciones/tipos` |
| `/instituciones/tipos` | `instituciones/tipos.astro` | Diagrama de Venn (SfmVennDiagram) |
| `/instituciones/contraste` | `instituciones/contraste.astro` | Panel comparativo BM vs SoFiPOs + 3 ComparisonCharts |
| `/instituciones/banca-multiple` | `instituciones/banca-multiple.astro` | KPIs + todas las gráficas de Banca Múltiple |
| `/instituciones/sofipos` | `instituciones/sofipos.astro` | KPIs + todas las gráficas de SoFiPOs |

---

## Sidebar — accordion de sub-navegación

### Comportamiento
- El item "Instituciones" en la sidebar sigue siendo un link a `/instituciones/tipos`.
- Cuando `Astro.url.pathname` comienza con `${base}/instituciones`, se renderizan los sub-items indentados debajo del item principal.
- Cuando la sidebar está **colapsada** (56px), los sub-items están ocultos. El ícono `Building2` enlaza a `/instituciones/tipos`.

### Estructura visual del accordion (sidebar expandida)

```
⬡  Instituciones          ← nav-item activo (border naranja)
   · Tipos de inst.        ← sub-item (activo si path = /instituciones/tipos)
   · Contraste de riesgo   ← sub-item
   POR INSTITUCIÓN         ← sub-group-label (solo texto, no clickable)
   · Banca Múltiple        ← sub-item
   · SoFiPOs               ← sub-item
```

### CSS de sub-items

Se agrega al bloque `<style is:global>` existente en `Sidebar.astro`:

```css
.subnav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 26px;
  border-radius: 6px;
  font-size: 0.6875rem; /* 11px */
  color: var(--color-text-mute);
  transition: color 150ms, background 150ms;
}
.subnav-item:hover {
  color: var(--color-text);
  background: var(--color-bg-elev);
}
.subnav-item.subnav-active {
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
  font-weight: 600;
}
.subnav-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
  opacity: 0.5;
}
.subnav-item.subnav-active .subnav-dot {
  opacity: 1;
}
.subnav-group-label {
  padding: 6px 10px 3px 26px;
  font-size: 0.5625rem; /* 9px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-mute);
  opacity: 0.5;
}
[data-sidebar][data-collapsed="true"] .subnav-item,
[data-sidebar][data-collapsed="true"] .subnav-group-label {
  display: none;
}
```

### Lógica de detección de sub-item activo (Astro.url.pathname)

```ts
const isInstituciones = path.startsWith(`${base}/instituciones`);

const SUBNAV = [
  { href: `${base}/instituciones/tipos`,           label: 'Tipos de inst.',      match: new RegExp(`^${base}/instituciones/tipos`) },
  { href: `${base}/instituciones/contraste`,       label: 'Contraste de riesgo', match: new RegExp(`^${base}/instituciones/contraste`) },
  // grupo: Por institución
  { href: `${base}/instituciones/banca-multiple`,  label: 'Banca Múltiple',      match: new RegExp(`^${base}/instituciones/banca-multiple`) },
  { href: `${base}/instituciones/sofipos`,         label: 'SoFiPOs',             match: new RegExp(`^${base}/instituciones/sofipos`) },
];
```

---

## Contenido de cada sub-página

### `tipos.astro`

Datos necesarios: **ninguno** (SfmVennDiagram es standalone).

Contenido:
```
<Section id="venn-sfm" eyebrow="Mapa del sistema" title="¿Qué tipo de institución es esta?" ...>
  <SfmVennDiagram client:visible />
</Section>
```

### `contraste.astro`

Datos necesarios: `data.credito` (imor, imora, roa, icor actuales + hpc para series históricas) + `data.sofipos` (fechas, imor_total, imora_total, roa, ultima).

Contenido:
- `EditorialHeadline` con el titular comparativo
- Panel BM vs SoFiPOs (grid `grid-cols-[1fr_auto_1fr]` con filas IMOR/IMORA/ROA/ICOR)
- Tres `ComparisonChart` en grid `md:grid-cols-3` (IMOR histórico, IMORA histórico, ROA histórico)
- `fmtDelta` helper y cálculo de deltas (copiar del original)

### `banca-multiple.astro`

Datos necesarios: `data.credito` (hpc, hpb) + `data.ifrs9` + `data.tasa_banxico`.

Contenido (en orden, igual que la sección BM actual):
1. `EditorialHeadline` — titular de Banca Múltiple
2. Grid 4 KPIs: IMOR, IMORA, ICOR, ROA (valores de `hpc`)
3. `Section` IMOR pivot → `ImorSegPivotChart` (solo BM: `showSofipos={false}`)
4. `Section` Tabla bancos → `BancosTable`
5. `Section` IMORA → `ImoraChart`
6. `Section` Quitas y castigos → `QuitasChart` (condicional si `hpc.quitas_castigos`)
7. `Section` ICOR → `IcorChart`
8. `Section` EPRC → `EprcChart` (condicional si `hpc.eprc_cartera`)
9. `Section` ROA/ROE → `RoaRoeChart`
10. `Section` MIF → `MifChart` (condicional si `hpc.mif && hpc.tasa_activa && hpc.tasa_pasiva`)
11. `Section` IFRS 9 → mini cards Stage 1/2/3 + `Ifrs9Chart`

Los 4 KPIs nuevos al inicio de la página usan valores directos de `hpc` (no `data.credito.imor.actual` — verificar equivalencia) — usar `hpc.imor_total.slice(-1)[0]` o el campo ya calculado en el schema.

### `sofipos.astro`

Datos necesarios: `data.sofipos` (s = data.sofipos, ultima = s.ultima, historico_por_entidad).

Contenido (en orden, igual que la sección SoFiPOs actual):
1. 4 KPIs: IMOR Total, IMOR Vivienda, IMORA, ROA
2. `EditorialHeadline` SoFiPOs
3. `Section` IMOR por cartera → `SofiposSegmentChart`
4. `Section` Top 15 entidades → `SofiposEntidadesChart` (con lógica `top15` y `SOFIPOS_PRIORITY`)
5. `Section` IMOR + ROA dual → `SofiposImoraRoaChart`

---

## Archivos

| Archivo | Acción |
|---|---|
| `app/src/pages/instituciones.astro` | **Eliminar** |
| `app/src/pages/instituciones/index.astro` | **Crear** — redirect a `/instituciones/tipos` |
| `app/src/pages/instituciones/tipos.astro` | **Crear** |
| `app/src/pages/instituciones/contraste.astro` | **Crear** |
| `app/src/pages/instituciones/banca-multiple.astro` | **Crear** |
| `app/src/pages/instituciones/sofipos.astro` | **Crear** |
| `app/src/components/shell/Sidebar.astro` | **Modificar** — accordion sub-nav |
| `app/src/components/shell/SectorToggle.tsx` | **Eliminar** — reemplazado por rutas |
| `app/src/components/shell/BottomNav.astro` | **Sin cambios** — regex ya cubre sub-rutas |

---

## Consideraciones de implementación

- **Redirect en index.astro**: usar `Astro.redirect('/instituciones/tipos', 301)` en el frontmatter. Astro soporta `return Astro.redirect(...)` desde el frontmatter.
- **TABS en Sidebar**: la entrada de Instituciones cambia su `href` a `${base}/instituciones/tipos` y su `sub` label a `undefined` (los sub-items reemplazan el sublabel).
- **KPIs en banca-multiple.astro**: los valores actuales están en `data.credito.imor.actual`, `data.credito.imora.actual`, etc. Usar esos campos, no recalcular desde las series.
- **Prefetch**: todos los sub-items de la sidebar llevan `data-astro-prefetch` para prefetch instantáneo al hover.
- **View Transitions**: funcionan automáticamente — la sidebar es shell estático, el contenido principal hace transición.
- **`ImorSegPivotChart` en banca-multiple**: recibe `pivotProps.bm` (no el objeto completo). Pasar solo el objeto `bm` con `fechas`, `cartera` y `bancos`.
- **`SofiposEntidadesChart` en sofipos**: requiere la lógica `top15` con `SOFIPOS_PRIORITY` — copiar la lógica de ordenamiento del original.
- **`SfmVennDiagram` en tipos**: no necesita props, es self-contained.

---

## Fuera de alcance

- Agregar SOFOM u otras instituciones — queda pendiente para cuando existan los datos.
- Rediseño de contenido dentro de cada sub-página — las gráficas y secciones se migran tal cual.
- Cambios al schema o loader de datos.
