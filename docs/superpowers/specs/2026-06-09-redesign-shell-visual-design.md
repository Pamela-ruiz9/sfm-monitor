# Redesign: Shell + Visual Polish (Enfoque B)

**Fecha:** 2026-06-09
**Alcance:** `app/` — todas las páginas heredan el nuevo shell
**Objetivo:** Mejorar la presentación visual y la claridad de navegación del SFM Monitor sin alterar datos, charts ni lógica de negocio.

---

## Decisiones de diseño

### Dirección visual
**Editorial Premium** — conserva el estilo dark + serif actual (Cormorant Garamond para valores, Inter para UI) pero con mejor jerarquía tipográfica, más espacio y proporciones refinadas. Referencia: Bloomberg Terminal editorial, Financial Times digital.

### Navegación
- **Desktop**: sidebar colapsable reemplaza el `TabBar` actual. Solo navegación — no KPIs. Expandida: 240px (icono + label). Colapsada: 56px (solo iconos).
- **Mobile**: sin cambios. `BottomNav` sigue siendo la navegación primaria.

### KPIs
Permanecen en el área principal del dashboard. Son los selectores de la gráfica activa — no se mueven a la sidebar.

---

## Sección 1 — Shell / Layout

### `Layout.astro`
Cambia su estructura de `flex-col` a `grid` en desktop:

```
[Sidebar 56–240px] | [Área principal 1fr]
```

El ancho de la columna izquierda es una CSS variable `--sidebar-w` que cambia entre `56px` (colapsada) y `240px` (expandida) con `transition: width 200ms ease`. En mobile (`< lg`): grid colapsa a columna única, sidebar oculta.

El slot `header` se mantiene para mobile (`lg:hidden` en desktop). La sidebar absorbe identidad y navegación en desktop.

### `Sidebar.astro` (nuevo, reemplaza `TabBar.astro`)

**Estado colapsado / expandido:**
- El estado se persiste en `localStorage` (`sfm-sidebar-collapsed`).
- Un nuevo nanostore `sidebarCollapsed` (`src/stores/sidebarState.ts`) sincroniza el valor entre el componente React del toggle y el layout.
- Botón de toggle: icono de flecha (`ChevronLeft` / `ChevronRight`) en la parte superior de la sidebar, alineado a la derecha.

**Estructura en estado expandido (240px) — de arriba a abajo:**

1. **Fila logo + toggle** — logo oficial a la izquierda, botón toggle a la derecha
   - Logo: `<SfmLogo variant="horizontal" size="md" showSubtitle />` cuando esté disponible el GIF animado se usa aquí en lugar del SVG estático (ver Sección 5)
2. **Separador**
3. **Descripción del proyecto** — 2 líneas: "Indicadores de riesgo del sistema financiero mexicano. Datos de Banxico SIE, CNBV e INEGI." + link `→ Metodología`
4. **Separador**
5. **Links de navegación** con icono Lucide + label + sublabel:
   - Home — Resumen / FX · Tasas
   - Thermometer — Riesgo Sistémico / Heatmap
   - Building2 — Instituciones / Banca · SoFiPOs
   - TrendingUp — Macro / PIB · IGAE
   - BookOpen — Metodología
6. **Spacer** (`flex-grow`)
7. **`DataFreshnessBadge`** — se mueve del Header al pie de la sidebar

**Estado colapsado (56px):**
- Logo colapsa a `<SfmLogo variant="icon" size="sm" />` (solo ícono ECG, sin texto)
- Descripción del proyecto: oculta
- Nav links: solo el icono centrado, sin label ni sublabel. Tooltip al hover con el nombre de la sección.
- `DataFreshnessBadge`: oculto (o reducido a punto de color)
- Toggle: icono `ChevronRight` centrado arriba

**Link activo:** `border-left: 2px solid var(--color-accent)` + `bg-[--color-bg-elev]` en expandido; fondo `bg-[--color-bg-elev]` sin border en colapsado (no hay espacio).

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

### `Footer.astro` — rediseño completo
El footer pasa de estar vacío/mínimo a ser un componente informativo visible en todas las páginas y tamaños de pantalla. Estructura en dos zonas:

**Zona izquierda / principal:**
- Logo `<SfmLogo variant="horizontal" size="sm" />`
- Descripción: "Indicadores de riesgo del sistema financiero mexicano. Datos de Banxico SIE, CNBV e INEGI."
- Créditos: "Autoría: Ingrid Pamela Ruiz Puga · Co-autoría: Artemio Padilla" con link a Metodología
- Licencias: MIT (código) / CC-BY 4.0 (contenido)

**Zona central / fuentes de consulta:**
- Título "Fuentes" en uppercase pequeño
- Banxico SIE — Sistema de Información Económica (link a `www.banxico.org.mx/SieInternet/`)
- CNBV — Comisión Nacional Bancaria y de Valores (link a `www.cnbv.gob.mx`)
- INEGI — Instituto Nacional de Estadística y Geografía (link a `www.inegi.org.mx`)
- Links en `text-[--color-text-mute]` con hover naranja, abren en `_blank`

**Zona derecha / redes sociales:**
- Título "Contacto" en uppercase pequeño
- GitHub del proyecto — `github.com/pamela-ruiz9/sfm-monitor`
- LinkedIn de Pamela — URL a definir como constante en el componente
- Twitter/X — si se provee URL (opcional)
- Iconos Lucide (`Github`, `Linkedin`, `Twitter`) + nombre de la red

**Layout:** `grid grid-cols-1 md:grid-cols-3` — en mobile se apila, en desktop tres columnas.
**Borde superior:** `border-t border-[--color-border]`. Fondo: `bg-[--color-bg]`.

---

## Sección 5 — Logo animado (GIF)

**Pendiente de asset:** La usuaria tiene un logo GIF animado que aún no está en el repositorio. Una vez disponible, se coloca en `app/public/sfm-logo-animated.gif`.

**Dónde se usa:** En la sidebar expandida en lugar de `<SfmLogo variant="horizontal" />` — el GIF reemplaza solo el bloque del logo, el resto de la sidebar no cambia. En la versión colapsada se sigue usando el SVG estático `<SfmLogo variant="icon" />` (el GIF animado a 56px quedaría demasiado pequeño).

**Implementación:** Condicionalmente — si `sfm-logo-animated.gif` existe en `public/`, se renderiza como `<img>` con `width` y `height` fijos. Si no existe, fallback al componente `SfmLogo` estático. Esto permite implementar el resto del shell sin bloquear en el asset.

---

## Alcance completo de archivos

| Archivo | Tipo de cambio |
|---|---|
| `src/layouts/Layout.astro` | Grid con `--sidebar-w` variable en desktop |
| `src/components/shell/Sidebar.astro` | Nuevo — colapsable, logo, nav, badge |
| `src/stores/sidebarState.ts` | Nuevo nanostore — estado colapsado/expandido |
| `src/components/shell/TabBar.astro` | Eliminado |
| `src/components/shell/Header.astro` | Oculto en desktop (`lg:hidden`) |
| `src/components/kpi/KpiCard.tsx` | 3 ajustes tipográficos/espaciado |
| `src/components/HeroScore.astro` | Quita pills y copy descriptivo |
| `src/components/Footer.astro` | Rediseño completo: info proyecto + redes sociales |
| `src/pages/metodologia.astro` | Añade sección "Sobre el proyecto" |
| `app/public/sfm-logo-animated.gif` | Asset pendiente de la usuaria |
| `src/components/shell/BottomNav.astro` | Sin cambios |
| `src/pages/*.astro` (resto) | Heredan shell, sin modificación de contenido |

**No se toca:** datos, schema, loader, stores, charts, drawer, alertas, lógica de negocio.

---

## Consideraciones de implementación

- `Sidebar.astro` replica la lógica de detección de tab activo de `TabBar.astro` (regex contra `Astro.url.pathname`).
- El toggle de colapso es un componente React (`SidebarToggle.tsx`) con `client:load` que lee/escribe `sidebarState` nanostore y persiste en `localStorage`.
- `--sidebar-w` se inyecta como inline style en el `<body>` o en el grid wrapper, actualizado por el toggle via JS.
- `DataFreshnessBadge` sigue siendo `client:load` — funciona igual en la sidebar.
- View transitions (`ClientRouter`) no se afectan — sidebar es shell estático fuera del área de transición.
- Los links de redes sociales del Footer son configurables como constantes en el propio `Footer.astro` — no se sacan a un archivo de config separado.

---

## Fuera de alcance

- Rediseño de contenido por página (Riesgo, Instituciones, Macro, SoFiPOs) — se hace en sprint posterior cuando el contenido de esas páginas esté completo.
- Cambio de paleta de colores o tipografía — se conserva el sistema de tokens actual.
- Nuevos indicadores o charts.
- Cambios al stack legacy (`index.html`).
