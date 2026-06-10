# Redesign: Shell + Visual Polish (Enfoque B)

**Fecha:** 2026-06-09
**Alcance:** `app/` — todas las páginas heredan el nuevo shell
**Objetivo:** Mejorar la presentación visual y la claridad de navegación del SFM Monitor sin alterar datos, charts ni lógica de negocio.

---

## Decisiones de diseño

### Dirección visual
**Editorial Premium** — conserva el estilo dark + serif actual (Cormorant Garamond para valores, Inter para UI) pero con mejor jerarquía tipográfica, más espacio y proporciones refinadas. Referencia: Bloomberg Terminal editorial, Financial Times digital.

### Navegación
- **Desktop**: sidebar fija de 240px reemplaza el `TabBar` actual. Solo navegación — no KPIs.
- **Mobile**: sin cambios. `BottomNav` sigue siendo la navegación primaria.

### KPIs
Permanecen en el área principal del dashboard. Son los selectores de la gráfica activa — no se mueven a la sidebar.

---

## Sección 1 — Shell / Layout

### `Layout.astro`
Cambia su estructura de `flex-col` a `grid` en desktop:

```
[Sidebar 240px] | [Área principal 1fr]
```

En mobile (`< lg`): grid colapsa a columna única, sidebar oculta.

El slot `header` se mantiene para mobile (`lg:hidden` en desktop). La sidebar absorbe identidad y navegación en desktop.

### `Sidebar.astro` (nuevo, reemplaza `TabBar.astro`)
Estructura vertical de arriba a abajo:

1. **Logo** — `<SfmLogo variant="horizontal" size="md" showSubtitle />` (componente oficial, incluye ícono ECG + wordmark "SFM" + subtítulo "Sistema Financiero Mexicano · Monitor")
2. **Separador**
3. **Descripción del proyecto** — 2 líneas: "Indicadores de riesgo del sistema financiero mexicano. Datos de Banxico SIE, CNBV e INEGI." + link `→ Metodología`
4. **Separador**
5. **Links de navegación** — mismo set de tabs actuales con icono + label + sublabel (igual que `TabBar`):
   - ⌂ Resumen / FX · Tasas
   - ⚠ Riesgo Sistémico / Heatmap
   - 🏦 Instituciones / Banca · SoFiPOs
   - 📈 Macro / PIB · IGAE
   - 📖 Metodología
6. **Spacer** (`flex-grow`)
7. **`DataFreshnessBadge`** — se mueve del Header a la parte inferior de la sidebar

Link activo: `border-left: 2px solid var(--color-accent)` + `bg-[--color-bg-elev]`, igual que el diseño aprobado en el brainstorm.

### `TabBar.astro`
Se elimina. Su lógica de tabs activos pasa a `Sidebar.astro`.

### `Header.astro`
En desktop se oculta completamente (`lg:hidden`) — la sidebar cubre todo lo que hacía. En mobile conserva su comportamiento actual: logo + `DataFreshnessBadge` + botón ⌘K.

---

## Sección 2 — KpiCard y HeroScore

### `KpiCard.tsx` — ajustes de polish
Tres cambios de presentación, sin tocar API ni lógica:

| Propiedad | Antes | Después |
|---|---|---|
| Valor numérico | `clamp(28px, 6vw, 38px)` | `clamp(32px, 7vw, 44px)` |
| Padding interno | `p-5` | `p-6` |
| Label (nombre indicador) | `text-[10px]` | `text-[11px]` |

### `HeroScore.astro` — simplificación
**Quitar:**
- Pills de Crédito / Macro / Mercado / Liquidez (la nav ya comunica que existen esas secciones)
- Copy descriptivo "Índice compuesto basado en indicadores de crédito..." (se mueve a la sidebar y a Metodología)

**Conservar:**
- Label "Score Global del Sistema" en naranja uppercase
- Headline serif con el score (ej. "Riesgo Contenido")
- Contador de alertas activas como único elemento secundario

---

## Sección 3 — Metodología y Footer

### `metodologia.astro` — sección "Sobre el proyecto"
Nueva sección al inicio de la página, antes del contenido técnico actual:

- **Título**: "Sobre el proyecto"
- **Autoría**: Ingrid Pamela Ruiz Puga (autora principal, BBVA México), Artemio Padilla (co-autor blueprint 2026)
- **Propósito** (3-4 líneas editoriales): qué monitorea, para quién, por qué existe
- **Fuentes de datos**: Banxico SIE, CNBV, INEGI — con links
- **Licencias**: MIT (código) / CC-BY 4.0 (contenido)

El contenido técnico de metodología de indicadores (IMOR, IMORA, IFRS9, etc.) sigue igual después de esta sección.

### `Footer.astro` — descripción en mobile
Añadir en el footer un bloque de 2 líneas visible solo en mobile (`lg:hidden`):

> "Indicadores de riesgo del sistema financiero mexicano. Datos de Banxico SIE, CNBV e INEGI."
> `→ Metodología`

Garantiza que la descripción del proyecto sea accesible en cualquier tamaño de pantalla.

---

## Alcance completo de archivos

| Archivo | Tipo de cambio |
|---|---|
| `src/layouts/Layout.astro` | Grid sidebar + main en desktop |
| `src/components/shell/Sidebar.astro` | Nuevo componente |
| `src/components/shell/TabBar.astro` | Eliminado |
| `src/components/shell/Header.astro` | Simplificado (desktop: solo ⌘K) |
| `src/components/kpi/KpiCard.tsx` | 3 ajustes tipográficos/espaciado |
| `src/components/HeroScore.astro` | Quita pills y copy descriptivo |
| `src/components/Footer.astro` | Añade descripción en mobile |
| `src/pages/metodologia.astro` | Añade sección "Sobre el proyecto" |
| `src/components/shell/BottomNav.astro` | Sin cambios |
| `src/pages/*.astro` (resto) | Heredan shell, sin modificación de contenido |

**No se toca:** datos, schema, loader, stores, charts, drawer, alertas, lógica de negocio.

---

## Consideraciones de implementación

- `Sidebar.astro` debe replicar la lógica de detección de tab activo que hoy vive en `TabBar.astro` (comparación de `Astro.url.pathname` con regex por sección).
- En `Layout.astro` el slot `header` sigue existiendo para mobile; en desktop se oculta con `lg:hidden` o se reduce.
- `DataFreshnessBadge` es un componente React con `client:load` — en la sidebar sigue funcionando igual.
- View transitions (`ClientRouter`) no se afectan — el sidebar es parte del shell estático, no del área de transición.

---

## Fuera de alcance

- Rediseño de contenido por página (Riesgo, Instituciones, Macro, SoFiPOs) — se hace en sprint posterior cuando el contenido de esas páginas esté completo.
- Cambio de paleta de colores o tipografía — se conserva el sistema de tokens actual.
- Nuevos indicadores o charts.
- Cambios al stack legacy (`index.html`).
