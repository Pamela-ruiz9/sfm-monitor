# Contenido Fase 2 — Quick wins de datos + Noticias polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar los datos pendientes que ya están en el JSON (SoFiPOs ROE, Remesas) y pulir la sección Noticias & Impacto con mejoras visuales ya planificadas (M1 grid, M3 ContextoBanda).

**Architecture:** Cinco tareas independientes, sin dependencias entre sí. Cada una produce un commit atómico funcional. Orden sugerido: M4 commit → US-309 → M3 → US-308 → M1.

**Tech Stack:** Astro 5, React 19, TypeScript strict, Tailwind v4, Chart.js 4 vía react-chartjs-2. Sin dependencias npm nuevas.

---

## Estado del arte (leer antes de ejecutar)

El feature Noticias & Impacto (`/macro/noticias`) está **completamente implementado y en producción** desde el sprint anterior. Los commits `4b7df90` y `f416fbb` cubrieron el MVP completo. Lo que está pendiente son:

1. **M4 fix** — `NoticiaCard.tsx` tiene `onError={() => setImageUrl(null)}` modificado pero **sin commit**.
2. **US-309** — `sofipos.roe` tiene 123 meses en el JSON. Falta el KpiCard y la línea en el chart.
3. **M3** — `ContextoBanda.tsx` necesita rediseño visual (labels más cortos, dot de color, sin delta).
4. **US-308** — `macro.remesas` tiene 22 meses en el JSON. Falta `RemesasChart.tsx` y KpiCard en Macro.
5. **M1** — Feed de Noticias en lista vertical ancha. Necesita grid 2 columnas en desktop y cards más compactas.

### Lo que ya está resuelto (NO tocar):
- M2 (`ImpactoTable.tsx`): ya tiene `sourceUrl?: string` y "Leer artículo fuente" — **ya implementado**.
- Los 4 trackers Watchboard, las 10 reglas, el filtro por categoría — todos en producción.

---

## File Map

| Acción | Archivo |
|---|---|
| Modificar | `app/src/components/noticias/NoticiaCard.tsx` (solo commit — ya editado) |
| Modificar | `app/src/components/charts/SofiposImoraRoaChart.tsx` |
| Modificar | `app/src/pages/instituciones/sofipos.astro` |
| Crear | `app/src/components/charts/RemesasChart.tsx` |
| Modificar | `app/src/pages/macro/index.astro` |
| Modificar | `app/src/components/noticias/ContextoBanda.tsx` |
| Modificar | `app/src/components/noticias/NoticiasFeed.tsx` |
| Modificar | `app/src/components/noticias/NoticiaCard.tsx` (Task 5 — grid) |
| Modificar | `CHANGELOG.md` |

---

## Task 1: Commit Noticias M4 — onError handler (NoticiaCard)

**Contexto:** `NoticiaCard.tsx` ya tiene el fix `onError={() => setImageUrl(null)}` aplicado (imagen rota → fallback a emoji). Solo falta commitearlo.

**Files:**
- Commit: `app/src/components/noticias/NoticiaCard.tsx`

- [ ] **Step 1: Verificar qué tiene el diff**

```bash
git diff app/src/components/noticias/NoticiaCard.tsx
```

Esperado: ver el `onError={() => setImageUrl(null)}` en el `<img>` y `setImageUrl` expuesto en el return de `useCardImage`.

- [ ] **Step 2: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep NoticiaCard
```

Esperado: sin output (sin errores).

- [ ] **Step 3: Commit**

```bash
git add app/src/components/noticias/NoticiaCard.tsx
git commit -m "fix(noticias): onError en imagen rota → fallback a emoji tracker (Noticias M4)"
```

---

## Task 2: US-309 — SoFiPOs ROE (XS effort)

Agregar la línea ROE al chart `SofiposImoraRoaChart` y su KpiCard. Los datos ya están: `s.roe` es array de 123 valores y `ultima.roe` es `-0.067` (número directo, igual que `ultima.roa`).

**Files:**
- Modify: `app/src/components/charts/SofiposImoraRoaChart.tsx`
- Modify: `app/src/pages/instituciones/sofipos.astro`

- [ ] **Step 1: Agregar prop `roe` al chart y tercera línea**

Reemplazar el contenido completo de `app/src/components/charts/SofiposImoraRoaChart.tsx`:

```tsx
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface Props {
  fechas: string[];
  imor: (number | null)[];
  roa: (number | null)[];
  roe?: (number | null)[];
}

export function SofiposImoraRoaChart({ fechas, imor, roa, roe }: Props) {
  const labels = fechas.map((f) => `${f}-15`);

  const datasets = [
    {
      label: 'IMOR Total',
      data: imor,
      borderColor: '#d29922',
      backgroundColor: 'rgba(210, 153, 34, 0.08)',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: 'y' as const,
      spanGaps: true,
    },
    {
      label: 'ROA',
      data: roa,
      borderColor: '#f85149',
      backgroundColor: 'rgba(248, 81, 73, 0.08)',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: 'y1' as const,
      spanGaps: true,
    },
    ...(roe
      ? [
          {
            label: 'ROE',
            data: roe,
            borderColor: '#79c0ff',
            backgroundColor: 'rgba(121, 192, 255, 0.08)',
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
            borderDash: [4, 3],
            yAxisID: 'y1' as const,
            spanGaps: true,
          },
        ]
      : []),
  ];

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMOR + ROA/ROE">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null
                      ? `${ctx.dataset.label}: —`
                      : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                position: 'left',
                min: 0,
                ticks: { color: '#d29922', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: {
                  display: true,
                  text: 'IMOR (%)',
                  color: '#d29922',
                  font: { size: 10 },
                },
              },
              y1: {
                position: 'right',
                ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
                grid: { drawOnChartArea: false },
                title: {
                  display: true,
                  text: 'ROA / ROE (%)',
                  color: '#94a3b8',
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
```

- [ ] **Step 2: Agregar KpiCard ROE y pasar prop `roe` en sofipos.astro**

En `app/src/pages/instituciones/sofipos.astro`:

**2a.** Agregar KpiCard de ROE justo después del KpiCard de ROA (líneas 98–106). El bloque actual es:

```astro
      <KpiCard
        label="ROA"
        value={formatPct(ultima.roa)}
        asOf={ultima.fecha}
        iconName="TrendingUp"
        tone="red"
        indicatorId="sofipos-roa"
        client:visible
      />
    </div>
```

Reemplazar con:

```astro
      <KpiCard
        label="ROA"
        value={formatPct(ultima.roa)}
        asOf={ultima.fecha}
        iconName="TrendingUp"
        tone="red"
        indicatorId="sofipos-roa"
        client:visible
      />
      <KpiCard
        label="ROE"
        value={formatPct(ultima.roe)}
        asOf={ultima.fecha}
        iconName="TrendingUp"
        tone={ultima.roe >= 0 ? 'green' : 'red'}
        client:visible
      />
    </div>
```

**2b.** En el `<SofiposImoraRoaChart>` (líneas 153–158), agregar `roe={s.roe}`:

```astro
      <SofiposImoraRoaChart
        fechas={s.fechas}
        imor={s.imor_total}
        roa={s.roa}
        roe={s.roe}
        client:visible
      />
```

**2c.** Actualizar el `description` de la sección `sofipos-imora-roa` (línea 150):

Cambiar:
```astro
      description="IMOR total (eje izquierdo) y ROA del sector (eje derecho). ROA negativo señala rentabilidad por debajo del costo de capital."
```

Por:
```astro
      description="IMOR total (eje izquierdo), ROA y ROE del sector (eje derecho, línea discontinua). Negativos señalan rentabilidad por debajo del costo de capital."
```

- [ ] **Step 3: Build + verificar sin errores TypeScript**

```bash
cd app && npm run build 2>&1 | tail -10
```

Esperado: build exitoso. Si hay error de tipo en `SofiposUltimaSchema` (porque `ultima.roe` no está en el tipo inferido), verificar que `SofiposUltimaSchema` en `schema.ts` incluye `roe: z.number()` — ya está en la línea 240 según el schema actual.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/charts/SofiposImoraRoaChart.tsx app/src/pages/instituciones/sofipos.astro
git commit -m "feat(sofipos): ROE — línea en chart IMOR+ROA/ROE y KpiCard (US-309)"
```

---

## Task 3: Noticias M3 — ContextoBanda más visual

**Problema:** Los labels de la API son largos y crudos ("US Recession Probability (Goldman Sachs Model)"). El `delta` puede ser texto extraño. La banda parece una lista de errores.

**Solución:** Truncar labels a 28 chars, eliminar `delta`, agregar dot de color, layout más compacto, link "via Watchboard ↗".

**Files:**
- Modify: `app/src/components/noticias/ContextoBanda.tsx`

- [ ] **Step 1: Reemplazar el contenido completo de ContextoBanda.tsx**

```tsx
// app/src/components/noticias/ContextoBanda.tsx
import { useEffect, useState } from 'react';

interface WbKpi {
  id: string;
  label: string;
  value: string;
  color: string;
}

interface WbKpisResponse {
  kpis: WbKpi[];
}

const KPI_KEYWORD_GROUPS = [
  ['recession', 'probability'],
  ['brent', 'oil', 'crude'],
  ['fomc', 'fed', 'federal reserve'],
  ['tariff', 'section 122', 'cliff'],
];

const DOT_COLOR: Record<string, string> = {
  red: '#f85149',
  amber: '#e3b341',
  green: '#56d364',
  blue: '#58a6ff',
};

function truncate(text: string, max = 28): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function selectKpis(kpis: WbKpi[]): WbKpi[] {
  const selected: WbKpi[] = [];
  const used = new Set<string>();

  for (const group of KPI_KEYWORD_GROUPS) {
    const found = kpis.find(
      (k) =>
        !used.has(k.id) &&
        group.some((kw) => k.label.toLowerCase().includes(kw)),
    );
    if (found) {
      selected.push(found);
      used.add(found.id);
    }
  }

  for (const k of kpis) {
    if (selected.length >= 4) break;
    if (!used.has(k.id)) {
      selected.push(k);
      used.add(k.id);
    }
  }

  return selected.slice(0, 4);
}

export function ContextoBanda() {
  const [kpis, setKpis] = useState<WbKpi[]>([]);

  useEffect(() => {
    fetch('https://watchboard.dev/api/v1/kpis/global-recession-risk.json')
      .then((r) => r.json() as Promise<WbKpisResponse>)
      .then((data) => setKpis(selectKpis(data.kpis ?? [])))
      .catch(() => {});
  }, []);

  if (kpis.length === 0) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2.5 mb-4"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elev)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[9px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--color-text-mute)' }}
        >
          Contexto global
        </span>
        <a
          href="https://watchboard.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          via Watchboard ↗
        </a>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="flex items-start gap-1.5">
            <span
              className="mt-0.5 shrink-0"
              style={{ color: DOT_COLOR[kpi.color] ?? 'var(--color-text-mute)', fontSize: '0.55rem' }}
              aria-hidden="true"
            >
              ●
            </span>
            <div>
              <div
                className="text-[9px] leading-tight"
                style={{ color: 'var(--color-text-mute)' }}
              >
                {truncate(kpi.label)}
              </div>
              <div
                className="text-xs font-bold leading-tight"
                style={{ color: DOT_COLOR[kpi.color] ?? 'var(--color-text)' }}
              >
                {kpi.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep ContextoBanda
```

Esperado: sin output.

- [ ] **Step 3: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add app/src/components/noticias/ContextoBanda.tsx
git commit -m "fix(noticias): ContextoBanda — labels truncados, dot de color, sin delta (Noticias M3)"
```

---

## Task 4: US-308 — Remesas familiares (KpiCard + chart)

`macro.remesas` tiene 22 meses de historia y el valor actual de $4,978 MUSD (serie SE27803). Solo falta la UI.

**Files:**
- Create: `app/src/components/charts/RemesasChart.tsx`
- Modify: `app/src/pages/macro/index.astro`

- [ ] **Step 1: Crear RemesasChart.tsx**

```tsx
// app/src/components/charts/RemesasChart.tsx
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface DataPoint {
  fecha: string;
  valor: number;
}

interface Props {
  series: DataPoint[];
}

export function RemesasChart({ series }: Props) {
  const labels = series.map((p) => `${p.fecha}-15`);
  const values = series.map((p) => p.valor);

  const data = {
    labels,
    datasets: [
      {
        label: 'Remesas (MUSD)',
        data: values,
        borderColor: '#56d364',
        backgroundColor: 'rgba(86, 211, 100, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Remesas familiares">
      <div className="h-52 md:h-64 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null
                      ? 'Remesas: —'
                      : `Remesas: $${y.toFixed(0)} MUSD`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
                ticks: { color: '#94a3b8', maxTicksLimit: 8 },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `$${v}`,
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: {
                  display: true,
                  text: 'MUSD',
                  color: '#94a3b8',
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep RemesasChart
```

Esperado: sin output.

- [ ] **Step 3: Agregar remesas en macro/index.astro**

**3a. Importar el chart** — agregar al bloque de imports en el frontmatter de `app/src/pages/macro/index.astro`, junto a los otros imports de charts:

```astro
import { RemesasChart } from '~/components/charts/RemesasChart';
```

**3b. Extraer datos de remesas** — agregar en el bloque de variables del frontmatter, después de la línea `const salarioHist = ...`:

```ts
const remesas       = macro.remesas ?? null;
const remesasActual = remesas?.actual ?? null;
const remesasFecha  = remesas?.fecha  ?? null;
const remesasHist   = remesas?.historico ?? [];
```

**3c. Agregar KpiCard de remesas** — en la `<div class="grid grid-cols-2 md:grid-cols-4 gap-3">` de KPIs, después del bloque del salario mínimo (`client:visible` con `tone="green"`):

```astro
      {remesasActual != null && (
        <KpiCard
          label="Remesas"
          value={`$${remesasActual.toFixed(0)}`}
          unit="MUSD"
          {...(remesasFecha ? { asOf: remesasFecha } : {})}
          iconName="TrendingUp"
          tone="green"
          client:visible
        />
      )}
```

**3d. Agregar sección Remesas con el chart** — agregar al final del `<div class="space-y-6">` principal, antes de los islands de shell (`<SwipeNav>`, `<PullToRefresh>`, etc.):

```astro
    <!-- ── Remesas ── -->
    {remesasHist.length > 0 && (
      <Section
        id="remesas"
        eyebrow="Sector externo"
        title="Remesas familiares"
        description="Flujo mensual de remesas familiares recibidas en México. Principal fuente de divisas del sector externo."
        source="Banco de México, SIE, serie SE27803"
        refCode="SE27803"
        tone="green">
        <RemesasChart series={remesasHist} client:visible />
      </Section>
    )}
```

- [ ] **Step 4: Build completo**

```bash
cd app && npm run build 2>&1 | tail -10
```

Esperado: sin errores. Verificar que `RemesasChart` aparece en el output del build Astro.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/charts/RemesasChart.tsx app/src/pages/macro/index.astro
git commit -m "feat(macro): Remesas familiares — KpiCard + RemesasChart en Macro (US-308)"
```

---

## Task 5: Noticias M1 — Grid 2 columnas y cards más compactas

**Problema:** El feed es una lista vertical ancha. En desktop se desperdicia espacio. Las cards son altas con imagen 16:9 y texto de tamaño normal, causando mucho scroll.

**Solución:** Grid 2 columnas en `sm` breakpoint, imagen 3:2, texto más compacto.

**Files:**
- Modify: `app/src/components/noticias/NoticiasFeed.tsx`
- Modify: `app/src/components/noticias/NoticiaCard.tsx`

- [ ] **Step 1: Actualizar el grid en NoticiasFeed.tsx**

En `app/src/components/noticias/NoticiasFeed.tsx`, localizar el bloque del feed:

```tsx
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <NoticiaCard key={item.id} item={item} />
          ))}
        </div>
```

Reemplazar con:

```tsx
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <NoticiaCard key={item.id} item={item} />
          ))}
        </div>
```

- [ ] **Step 2: Hacer la card más compacta en NoticiaCard.tsx**

En `app/src/components/noticias/NoticiaCard.tsx`, realizar los siguientes cambios de estilo (sin alterar lógica):

**2a.** Aspecto ratio de la imagen — cambiar de `16/9` a `3/2`:

```tsx
        style={{ aspectRatio: '3/2', ...
```

**2b.** Padding del body — cambiar `p-3` a `p-2.5`:

```tsx
      <div className="p-2.5">
```

**2c.** Emoji fallback — reducir tamaño de `2.5rem` a `2rem`:

```tsx
          <span style={{ fontSize: '2rem' }}>{item.trackerEmoji}</span>
```

**2d.** Título — cambiar `text-sm font-semibold` a `text-xs font-semibold`:

```tsx
        <h3 className="text-xs font-semibold leading-snug mb-2" style={{ color: 'var(--color-text)' }}>
```

**2e.** Chips de impacto — cambiar `gap-1.5 mb-2` a `gap-1 mb-1.5`:

```tsx
          <div className="flex flex-wrap gap-1 mb-1.5">
```

- [ ] **Step 3: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep -E "NoticiaCard|NoticiasFeed"
```

Esperado: sin output.

- [ ] **Step 4: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

Esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add app/src/components/noticias/NoticiasFeed.tsx app/src/components/noticias/NoticiaCard.tsx
git commit -m "fix(noticias): grid 2 columnas desktop + cards compactas (Noticias M1)"
```

---

## Task 6: CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Agregar entradas bajo `[Sin publicar]` → `### Agregado`**

```markdown
- **Remesas familiares** — KpiCard + `RemesasChart.tsx` en Macro. Datos Banxico SE27803 (22 meses, ~$4,978 MUSD). Cierra US-308.
- **SoFiPOs ROE** — `sofipos.roe` (123 meses) ahora visible: línea discontinua azul en chart IMOR+ROA/ROE y KpiCard en SoFiPOs. Cierra US-309.
```

Bajo `### Corregido`:

```markdown
- **Noticias M4** — imágenes Microlink rotas muestran emoji fallback en lugar de ícono de imagen rota del browser (`onError` handler en `NoticiaCard.tsx`).
- **Noticias M3** — `ContextoBanda` rediseñada: labels truncados a 28 chars, punto de color por indicador, eliminado `delta` verboso, link "via Watchboard ↗".
- **Noticias M1** — Feed de noticias en grid 2 columnas en desktop (antes lista vertical), cards con imagen 3:2 y texto más compacto.
```

- [ ] **Step 2: Verificar build final**

```bash
cd app && npm run build 2>&1 | tail -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "chore: CHANGELOG — Remesas, SoFiPOs ROE, Noticias polish M1/M3/M4"
```

---

## Verificación manual post-implementación

Correr `cd app && npm run preview` y visitar:

| Ruta | Qué verificar |
|---|---|
| `/instituciones/sofipos` | KpiCard ROE visible · Línea discontinua azul en chart IMOR+ROA/ROE |
| `/macro` | KpiCard Remesas muestra `$4,978 MUSD` · Sección "Remesas familiares" con chart |
| `/macro/noticias` | Banda de contexto rediseñada (dot de color, labels cortos) · Cards en grid 2 col en desktop · Imágenes rotas muestran emoji |

---

## Fuera de scope — próximos planes

- **Fichas metodológicas** (Content Collections MDX, Sprint M4 pendiente) → plan separado
- **US-401 filtros banco×cartera** → Epic 4, plan separado
- **IGAE historia pre-2026** → bloqueado por IDs rotos INEGI (probe-inegi.yml en Actions)
- **ICAP / LCR** → requiere descarga manual CNBV

---

*Plan creado: 2026-06-10*
