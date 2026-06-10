# Spec: Noticias & Impacto — /macro/noticias

**Fecha:** 2026-06-10  
**Autora:** Ingrid Pamela Ruiz Puga  
**Issue:** #100  
**Estado:** Aprobado — pendiente de plan de implementación

---

## Objetivo

Agregar una sub-página `/macro/noticias` al tab Macro que muestre un feed de eventos macroeconómicos relevantes obtenidos de la API pública de Watchboard, enriquecidos con análisis de impacto sobre los ejes del Sistema Financiero Mexicano (mora, liquidez, solvencia, rentabilidad) mediante reglas estáticas. Sin dependencia de IA en runtime, sin tokens, sin suscripción.

---

## Navegación

- **URL:** `/macro/noticias`  
- **Patrón:** sub-nav dentro del tab Macro, igual al patrón de Instituciones (`/instituciones/tipos`, `/instituciones/banca-multiple`, etc.)
- `macro.astro` existente permanece en `/macro` con sus métricas actuales (PIB, IGAE, desempleo, inflación, etc.)
- El Sidebar muestra sub-nav cuando la ruta activa comienza con `/macro`:
  - **Indicadores** → `/macro`
  - **Noticias & Impacto** → `/macro/noticias`
- `BottomNav.astro` sin cambios (5 ítems actuales se mantienen)
- `activeTab.ts`: `/macro/noticias` mapea al `TabId` `'macro'`

---

## Fuente de datos — Watchboard API

API pública, sin autenticación, CORS abierto (`Access-Control-Allow-Origin: *`), archivos estáticos en CDN con `Cache-Control: public, max-age=3600`.

**Base URL:** `https://watchboard.dev/api/v1`

### Trackers utilizados

| Tracker slug | Endpoint de eventos | Categoría SFM | Filtro de tipos |
|---|---|---|---|
| `global-recession-risk` | `/events/global-recession-risk.json` | Política monetaria / Externa | todos |
| `sheinbaum-presidency` | `/events/sheinbaum-presidency.json` | Fiscal | `economic`, `political` |
| `trump-presidencies` | `/events/trump-presidencies.json` | Externa | `trade`, `economic` |
| `mexico` | `/events/mexico.json` | Sistémica | `economic`, `market` |

### Endpoint de KPIs (banda de contexto)

`/kpis/global-recession-risk.json` — devuelve array de KPIs con `label`, `value`, `color`, `trend`, `delta`.

### Estructura de un evento

```ts
{
  id: string,
  date: string,          // "YYYY-MM-DD"
  title: string,
  type: string,          // "economic" | "policy" | "market" | "trade" | "political" | ...
  detail: string,        // narrativa 500–2000 chars
  sources: Array<{
    name: string,        // "Reuters", "AP", "Bloomberg", etc.
    tier: number,        // 1–4
    url: string,
    pole: string
  }>
}
```

### Fetch e integración

- Fetch **client-side** al montar el componente React (`useEffect` o React Query sin SSR)
- 4 fetches en paralelo (`Promise.all`)
- Merge de eventos de todos los trackers, sort por `date` descendente
- Deduplicación por `id`
- Máximo 40 eventos combinados en el feed (límite natural de 30 por tracker desde el API + merge)
- Si un tracker falla, se muestra igualmente con los trackers disponibles (degradación graceful)

---

## Imágenes

Cada card intenta mostrar la imagen del artículo fuente vía **Microlink API**:

```
https://api.microlink.io/?url={encodeURIComponent(sources[0].url)}&meta=true
```

- Fetch lazy: solo cuando la card entra al viewport (`IntersectionObserver`)
- Respuesta: campo `data.image.url` contiene la og:image del artículo
- **Fallback:** si Microlink falla, la card muestra el emoji del tracker (`📉`, `🇲🇽`, etc.) sobre un fondo con el `color` del tracker
- Las imágenes se muestran en formato 16:9, `object-fit: cover`, con ancho completo de la card
- No se cachean localmente en esta fase (MVP)

---

## Estructura de la página `/macro/noticias`

```
[Banda de contexto global]
[Filtros por categoría]
[Feed de cards]
```

### 1. Banda de contexto

Franja compacta (no colapsable) con 4 KPIs seleccionados de `global-recession-risk`:

| KPI | Campo API | Descripción |
|---|---|---|
| Riesgo recesión | KPI con label que contenga "Recession" o "Probability" | Probabilidad estimada |
| Brent crude | KPI con label que contenga "Brent" u "Oil" | Precio actual y delta |
| FOMC outlook | KPI con label que contenga "FOMC" o "Fed" | Decisión esperada |
| Tariff cliff | KPI con label que contenga "tariff" o "Section 122" | Días restantes o estado |

Si algún KPI no se encuentra por label, se muestran los primeros 4 disponibles. Cada KPI muestra `value`, `delta` y `color` del API (red/amber/green → rojo/ámbar/verde en la UI).

### 2. Filtros por categoría

Pills horizontales, scroll horizontal en móvil:
- **Todas** (default activo)
- **Política monetaria**
- **Fiscal**
- **Externa**
- **Sistémica**

La categoría de cada evento se determina en `watchboard-rules.ts` por `tracker slug` (ver sección Reglas).

### 3. Feed de cards

Lista vertical, sin paginación en MVP. Cada card ocupa ancho completo del contenedor.

---

## Diseño de card

### Estado colapsado

```
┌─────────────────────────────────────────────┐
│ [imagen 16:9 del artículo, lazy via Microlink│
│  o fallback: emoji + color tracker]          │
├─────────────────────────────────────────────┤
│ [TAG CATEGORÍA]  fecha · outlet              │
│                                              │
│ Titular del evento                           │
│                                              │
│ [↑ Mora]  [↓ Liquidez]  (chips de impacto)  │
│                                              │
│ ▸ Ver análisis completo →                    │
└─────────────────────────────────────────────┘
```

- **Tag de categoría:** pill coloreado (azul = política monetaria, naranja = fiscal, rojo = externa, gris = sistémica)
- **Fecha:** `date` del evento formateado como "10 jun 2026"
- **Outlet:** `sources[0].name`
- **Titular:** `title` del evento (sin truncar)
- **Chips de impacto:** generados por reglas estáticas. Si ninguna regla aplica, no se muestran chips (la card es válida sin ellos)
- **"Ver análisis completo":** solo aparece si hay al menos una regla que aplique

### Estado expandido (toggle, no navegación)

```
┌─────────────────────────────────────────────┐
│ ANÁLISIS DE IMPACTO EN SFM                  │
│                                              │
│ Mecanismo: [texto ~1 línea del canal de      │
│ transmisión, ej: "Hawkish Fed → TIIE         │
│ elevada → costo fondeo → IMOR consumo"]      │
│                                              │
│ ┌────────────────┬──────────────┬──────────┐ │
│ │ Eje SFM        │ Dirección    │ Horizonte│ │
│ ├────────────────┼──────────────┼──────────┤ │
│ │ Mora           │ ↑ Alcista    │ 3–6m     │ │
│ │ Rentabilidad   │ ↑ Mejora     │ inmediato│ │
│ └────────────────┴──────────────┴──────────┘ │
│                                              │
│ ↗ Ver evento completo en Watchboard          │
└─────────────────────────────────────────────┘
```

- La tabla solo muestra los ejes presentes en las reglas que aplican al evento. El mockup arriba es ilustrativo — en la práctica R01 (Fed/FOMC) solo afecta mora y rentabilidad, por lo que esos son los únicos ejes en la tabla.
- Los ejes no mencionados por ninguna regla aplicable se omiten (no se muestran como "→ Neutral")
- El link a Watchboard apunta a `https://watchboard.dev` (página principal, no permalink por evento ya que la API no expone URLs de evento)

---

## Reglas de impacto (`src/data/watchboard-rules.ts`)

Archivo TypeScript estático. Matching determinístico: `tracker slug` + `event type` + keywords en `title.toLowerCase()`.

### Estructura de una regla

```ts
type ImpactDirection = 'alcista' | 'bajista' | 'presion' | 'mejora' | 'neutral';
type SfmAxis = 'mora' | 'liquidez' | 'solvencia' | 'rentabilidad';
type Horizon = 'inmediato' | '3m' | '3-6m' | '6m' | '6-12m' | '12m';

interface AxisImpact {
  axis: SfmAxis;
  direction: ImpactDirection;
  horizon: Horizon;
}

interface WatchboardRule {
  id: string;
  trackers: string[];          // slugs que activan la regla
  types?: string[];            // event types que activan (undefined = todos)
  keywords: string[];          // OR: basta con que uno esté en el title
  category: NoticiaCategory;   // categoría SFM asignada al evento
  mechanism: string;           // descripción del canal de transmisión
  axes: AxisImpact[];          // ejes afectados (omitir los neutrales)
}
```

### 10 reglas base

| ID | Trackers | Tipos | Keywords | Categoría | Mecanismo | Ejes |
|---|---|---|---|---|---|---|
| R01 | `global-recession-risk` | `policy` | fed, fomc, warsh, tasa, rate | Política monetaria | Hawkish Fed → TIIE elevada → costo fondeo → IMOR consumo | Mora ↑ 3–6m · Rentabilidad ↑ inmediato |
| R02 | `global-recession-risk`, `trump-presidencies` | `trade` | tariff, arancel, section 122, trade war | Externa | Aranceles → contracción comercial → FX presión → liquidez empresarial | Liquidez ↓ 3m · Mora ↑ 3–6m |
| R03 | `global-recession-risk` | `market` | oil, crude, brent, petróleo | Externa | Brent bajo → inflación baja → menor presión TIIE → fondeo estable | (solo categorización, sin chips de impacto) |
| R04 | `global-recession-risk` | `economic` | recession, recesión, gdp, pmi, slowdown | Política monetaria | Desaceleración global → remesas/exportaciones bajan → IMOR lagging | Mora ↑ 6–12m · Liquidez ↓ 6m |
| R05 | `sheinbaum-presidency` | `economic` | fdi, ied, inversión, nearshoring, inversion | Fiscal | IED récord → flujos capital → FX estable → fondeo barato | Liquidez ↑ inmediato–3m |
| R06 | `sheinbaum-presidency`, `trump-presidencies` | `trade`, `economic` | usmca, renegociación, aranceles mx, mexico tariff | Externa | Incertidumbre USMCA → riesgo exportador → IMOR empresarial | Mora ↑ 6m · Liquidez ↓ 3m |
| R07 | `sheinbaum-presidency` | `political` | cnte, huelga, reforma, strike | Sistémica | Incertidumbre regulatoria/fiscal → riesgo soberano leve | Solvencia ↓ 6–12m |
| R08 | `global-recession-risk` | `economic` | inflation, inflación, pce, cpi, inpc | Política monetaria | Inflación alta → TIIE no baja → costo crédito consumo | Mora ↑ 3m · Rentabilidad ↑ inmediato |
| R09 | `mexico` | `economic` | pemex, deuda, déficit, fiscal | Sistémica | Riesgo soberano/cuasi-soberano → spread bancario → solvencia sistémica | Solvencia ↓ 6–12m |
| R10 | `sheinbaum-presidency`, `mexico` | `economic` | tomato, tomate, precio, canasta, salario | Fiscal | Presión precios consumo → INPC → expectativas inflación | Mora ↑ 3m |

### Aplicación de reglas

```
Para cada evento:
  1. Filtrar reglas donde tracker ∈ rule.trackers
  2. Filtrar reglas donde event.type ∈ rule.types (si rule.types definido)
  3. Filtrar reglas donde algún keyword ∈ event.title.toLowerCase()
  4. Tomar TODAS las reglas que pasen los tres filtros (puede haber más de una)
  5. Categoría: la de la primera regla que aplique
  6. Mecanismo: el de la primera regla que aplique
  7. Axes: merge de todos los axes de todas las reglas aplicables;
     en conflicto (mismo eje, distintas reglas), gana la primera regla
  8. Si no hay match: asignar categoría por tracker (fallback) + sin impacto
```

Si `sources` está vacío, se omite el fetch de imagen (fallback directo a emoji del tracker).

**Categoría fallback por tracker (sin match de regla):**
- `global-recession-risk` → "Política monetaria"
- `sheinbaum-presidency` → "Fiscal"
- `trump-presidencies` → "Externa"
- `mexico` → "Sistémica"

---

## Componentes nuevos

```
app/src/
├── pages/
│   └── macro/
│       └── noticias.astro          ← nueva página
├── components/
│   └── noticias/
│       ├── NoticiasFeed.tsx        ← island React: fetch + estado + lista
│       ├── ContextoBanda.tsx       ← KPIs de global-recession-risk
│       ├── CategoriaFilter.tsx     ← pills de filtro
│       ├── NoticiaCard.tsx         ← card individual (colapsado + expandido)
│       └── ImpactoTable.tsx        ← tabla de ejes SFM
└── data/
    └── watchboard-rules.ts         ← reglas de impacto estáticas
```

`macro.astro` se actualiza para agregar el sub-nav Indicadores / Noticias & Impacto.  
`Sidebar.astro` se actualiza para mostrar el sub-nav cuando path comienza con `/macro`.  
`activeTab.ts` agrega `/macro/noticias` al mapa `PATH_TO_TAB` → `'macro'`.

---

## Sección en Metodología

Nueva sección **"Noticias & Impacto"** en `metodologia.astro` con:

- **Fuente:** Watchboard (`watchboard.dev`), desarrollado por Artemio Padilla. API pública sin costo ni autenticación.
- **Trackers monitoreados:** tabla con los 4 slugs, su foco temático y la categoría SFM asignada
- **Metodología de reglas de impacto:** explicación de que el análisis es estático (basado en reglas predefinidas, no IA), con referencia a los canales de transmisión estándar de política monetaria (TIIE → IMOR, FX → liquidez, etc.)
- **Limitaciones:** las reglas capturan el canal principal pero no escenarios compuestos; no son predictivas; el horizonte es orientativo
- **Crédito:** Watchboard API y Artemio Padilla como co-autor del blueprint 2026

---

## Criterios de aceptación (MVP)

- [ ] `/macro/noticias` carga sin errores en desktop y móvil
- [ ] Sub-nav Macro activo muestra "Indicadores" y "Noticias & Impacto"
- [ ] Banda de contexto muestra 4 KPIs con color correcto (rojo/ámbar/verde)
- [ ] Feed muestra eventos de los 4 trackers mezclados, ordenados por fecha
- [ ] Filtros por categoría funcionan correctamente
- [ ] Al menos 8 de los 10 eventos más recientes tienen regla de impacto aplicada
- [ ] Chips de impacto se muestran en el estado colapsado
- [ ] Tabla de ejes SFM se muestra al expandir
- [ ] Imágenes cargan lazy; fallback a emoji visible cuando Microlink falla
- [ ] Link a Watchboard abre en tab nueva
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Sección "Noticias & Impacto" visible en `/metodologia`

---

## Fuera de alcance (MVP)

- Breaking news badge (se puede agregar en fase 2, el flag ya existe en la API)
- Auto-refresh periódico de la página
- Timeline de eventos marcados sobre series históricas (fase 2, issue #100)
- Mapa de calor de correlaciones (fase 2)
- Análisis de impacto dinámico vía LLM (fase 3)
- Caché local de imágenes Microlink
