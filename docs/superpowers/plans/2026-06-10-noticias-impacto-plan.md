# Noticias & Impacto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar `/macro/noticias` — un feed de eventos macroeconómicos de Watchboard API con análisis de impacto estático sobre los ejes del SFM (mora / liquidez / solvencia / rentabilidad).

**Architecture:** `watchboard-rules.ts` contiene tipos + 10 reglas + `applyRules()` (pura, testeable). `NoticiasFeed.tsx` es un island React que fetcha 4 trackers en paralelo, aplica reglas, filtra y renderiza. `ContextoBanda.tsx` fetcha KPIs de Watchboard independientemente. `noticias.astro` es la página shell que monta ambos islands.

**Tech Stack:** Astro 5, React 19, TypeScript strict, Tailwind v4, Vitest 4 (tests unitarios). Sin dependencias nuevas de npm — solo fetch nativo + IntersectionObserver.

---

## File Map

| Acción | Archivo |
|---|---|
| Crear | `app/src/data/watchboard-rules.ts` |
| Crear | `app/tests/unit/watchboard-rules.test.ts` |
| Mover | `app/src/pages/macro.astro` → `app/src/pages/macro/index.astro` |
| Crear | `app/src/pages/macro/noticias.astro` |
| Modificar | `app/src/stores/activeTab.ts` |
| Modificar | `app/src/components/shell/Sidebar.astro` |
| Crear | `app/src/components/noticias/ContextoBanda.tsx` |
| Crear | `app/src/components/noticias/ImpactoTable.tsx` |
| Crear | `app/src/components/noticias/NoticiaCard.tsx` |
| Crear | `app/src/components/noticias/NoticiasFeed.tsx` |
| Modificar | `app/src/pages/metodologia.astro` |
| Modificar | `app/CHANGELOG.md` |

---

## Task 1: watchboard-rules.ts — tipos, reglas y applyRules()

**Files:**
- Create: `app/src/data/watchboard-rules.ts`

- [ ] **Step 1: Crear el archivo con tipos, reglas y función**

```ts
// app/src/data/watchboard-rules.ts

export type NoticiaCategory =
  | 'politica-monetaria'
  | 'fiscal'
  | 'externa'
  | 'sistemica';

export type ImpactDirection = 'alcista' | 'bajista' | 'presion' | 'mejora';
export type SfmAxis = 'mora' | 'liquidez' | 'solvencia' | 'rentabilidad';
export type Horizon = 'inmediato' | '3m' | '3-6m' | '6m' | '6-12m' | '12m';

export interface AxisImpact {
  axis: SfmAxis;
  direction: ImpactDirection;
  horizon: Horizon;
}

export interface EventImpact {
  category: NoticiaCategory;
  mechanism: string;
  axes: AxisImpact[];
}

interface WatchboardRule {
  id: string;
  trackers: string[];
  types?: string[];
  keywords: string[];
  category: NoticiaCategory;
  mechanism: string;
  axes: AxisImpact[];
}

export const CATEGORY_CONFIG: Record<
  NoticiaCategory,
  { label: string; bg: string; text: string; border: string }
> = {
  'politica-monetaria': {
    label: 'Política monetaria',
    bg: 'rgba(31,58,95,0.6)',
    text: '#79c0ff',
    border: '#1f3a5f',
  },
  fiscal: {
    label: 'Fiscal',
    bg: 'rgba(45,28,10,0.6)',
    text: '#e6621e',
    border: '#7c3d14',
  },
  externa: {
    label: 'Externa',
    bg: 'rgba(45,27,27,0.6)',
    text: '#f85149',
    border: '#6e1d1d',
  },
  sistemica: {
    label: 'Sistémica',
    bg: 'rgba(33,38,45,0.6)',
    text: '#8b949e',
    border: '#30363d',
  },
};

export const DIRECTION_CONFIG: Record<
  ImpactDirection,
  { symbol: string; color: string; bg: string; border: string }
> = {
  alcista: { symbol: '↑', color: '#f85149', bg: 'rgba(45,27,27,0.5)', border: '#f85149' },
  presion: { symbol: '↓', color: '#f85149', bg: 'rgba(45,27,27,0.5)', border: '#f85149' },
  bajista: { symbol: '↓', color: '#56d364', bg: 'rgba(27,45,27,0.5)', border: '#56d364' },
  mejora:  { symbol: '↑', color: '#56d364', bg: 'rgba(27,45,27,0.5)', border: '#56d364' },
};

export const AXIS_LABEL: Record<SfmAxis, string> = {
  mora: 'Mora',
  liquidez: 'Liquidez',
  solvencia: 'Solvencia',
  rentabilidad: 'Rentabilidad',
};

const TRACKER_FALLBACK: Record<string, NoticiaCategory> = {
  'global-recession-risk': 'politica-monetaria',
  'sheinbaum-presidency': 'fiscal',
  'trump-presidencies': 'externa',
  mexico: 'sistemica',
};

const RULES: WatchboardRule[] = [
  {
    id: 'R01',
    trackers: ['global-recession-risk'],
    types: ['policy'],
    keywords: ['fed', 'fomc', 'warsh', 'tasa', 'rate'],
    category: 'politica-monetaria',
    mechanism: 'Hawkish Fed → TIIE elevada → costo fondeo → IMOR consumo',
    axes: [
      { axis: 'mora', direction: 'alcista', horizon: '3-6m' },
      { axis: 'rentabilidad', direction: 'mejora', horizon: 'inmediato' },
    ],
  },
  {
    id: 'R02',
    trackers: ['global-recession-risk', 'trump-presidencies'],
    types: ['trade'],
    keywords: ['tariff', 'arancel', 'section 122', 'trade war'],
    category: 'externa',
    mechanism: 'Aranceles → contracción comercial → FX presión → liquidez empresarial',
    axes: [
      { axis: 'liquidez', direction: 'presion', horizon: '3m' },
      { axis: 'mora', direction: 'alcista', horizon: '3-6m' },
    ],
  },
  {
    id: 'R03',
    trackers: ['global-recession-risk'],
    types: ['market'],
    keywords: ['oil', 'crude', 'brent', 'petróleo', 'petroleo'],
    category: 'externa',
    mechanism: 'Brent bajo → inflación baja → menor presión TIIE → fondeo estable',
    axes: [],
  },
  {
    id: 'R04',
    trackers: ['global-recession-risk'],
    types: ['economic'],
    keywords: ['recession', 'recesión', 'recesion', 'gdp', 'pmi', 'slowdown'],
    category: 'politica-monetaria',
    mechanism: 'Desaceleración global → remesas/exportaciones bajan → IMOR lagging',
    axes: [
      { axis: 'mora', direction: 'alcista', horizon: '6-12m' },
      { axis: 'liquidez', direction: 'presion', horizon: '6m' },
    ],
  },
  {
    id: 'R05',
    trackers: ['sheinbaum-presidency'],
    types: ['economic'],
    keywords: ['fdi', 'ied', 'inversión', 'inversion', 'nearshoring'],
    category: 'fiscal',
    mechanism: 'IED récord → flujos capital → FX estable → fondeo barato',
    axes: [{ axis: 'liquidez', direction: 'mejora', horizon: '3m' }],
  },
  {
    id: 'R06',
    trackers: ['sheinbaum-presidency', 'trump-presidencies'],
    types: ['trade', 'economic'],
    keywords: ['usmca', 'renegociación', 'renegociacion', 'aranceles mx', 'mexico tariff'],
    category: 'externa',
    mechanism: 'Incertidumbre USMCA → riesgo exportador → IMOR empresarial',
    axes: [
      { axis: 'mora', direction: 'alcista', horizon: '6m' },
      { axis: 'liquidez', direction: 'presion', horizon: '3m' },
    ],
  },
  {
    id: 'R07',
    trackers: ['sheinbaum-presidency'],
    types: ['political'],
    keywords: ['cnte', 'huelga', 'reforma', 'strike'],
    category: 'sistemica',
    mechanism: 'Incertidumbre regulatoria/fiscal → riesgo soberano leve',
    axes: [{ axis: 'solvencia', direction: 'presion', horizon: '6-12m' }],
  },
  {
    id: 'R08',
    trackers: ['global-recession-risk'],
    types: ['economic'],
    keywords: ['inflation', 'inflación', 'inflacion', 'pce', 'cpi', 'inpc'],
    category: 'politica-monetaria',
    mechanism: 'Inflación alta → TIIE no baja → costo crédito consumo',
    axes: [
      { axis: 'mora', direction: 'alcista', horizon: '3m' },
      { axis: 'rentabilidad', direction: 'mejora', horizon: 'inmediato' },
    ],
  },
  {
    id: 'R09',
    trackers: ['mexico'],
    types: ['economic'],
    keywords: ['pemex', 'deuda', 'déficit', 'deficit', 'fiscal'],
    category: 'sistemica',
    mechanism: 'Riesgo soberano/cuasi-soberano → spread bancario → solvencia sistémica',
    axes: [{ axis: 'solvencia', direction: 'presion', horizon: '6-12m' }],
  },
  {
    id: 'R10',
    trackers: ['sheinbaum-presidency', 'mexico'],
    types: ['economic'],
    keywords: ['tomato', 'tomate', 'precio', 'canasta', 'salario'],
    category: 'fiscal',
    mechanism: 'Presión precios consumo → INPC → expectativas inflación',
    axes: [{ axis: 'mora', direction: 'alcista', horizon: '3m' }],
  },
];

export function applyRules(
  event: { title: string; type: string },
  tracker: string,
): EventImpact {
  const titleLower = event.title.toLowerCase();

  const matching = RULES.filter(
    (rule) =>
      rule.trackers.includes(tracker) &&
      (rule.types === undefined || rule.types.includes(event.type)) &&
      rule.keywords.some((kw) => titleLower.includes(kw)),
  );

  if (matching.length === 0) {
    return {
      category: TRACKER_FALLBACK[tracker] ?? 'sistemica',
      mechanism: '',
      axes: [],
    };
  }

  const first = matching[0]!;
  const axisMap = new Map<SfmAxis, AxisImpact>();
  for (const rule of matching) {
    for (const ai of rule.axes) {
      if (!axisMap.has(ai.axis)) axisMap.set(ai.axis, ai);
    }
  }

  return {
    category: first.category,
    mechanism: first.mechanism,
    axes: Array.from(axisMap.values()),
  };
}
```

- [ ] **Step 2: Verificar que TypeScript lo acepta**

```bash
cd app && npx tsc --noEmit 2>&1 | grep watchboard-rules
```

Esperado: sin output (sin errores).

- [ ] **Step 3: Commit**

```bash
cd app && git add src/data/watchboard-rules.ts
git commit -m "feat(noticias): watchboard-rules — tipos, 10 reglas y applyRules()"
```

---

## Task 2: Tests unitarios para applyRules()

**Files:**
- Create: `app/tests/unit/watchboard-rules.test.ts`

- [ ] **Step 1: Escribir los tests**

```ts
// app/tests/unit/watchboard-rules.test.ts
import { describe, expect, it } from 'vitest';
import { applyRules } from '~/data/watchboard-rules';

describe('applyRules — fallback', () => {
  it('sin match de regla: devuelve categoría fallback del tracker', () => {
    const r = applyRules({ title: 'Evento sin keywords', type: 'social' }, 'sheinbaum-presidency');
    expect(r.category).toBe('fiscal');
    expect(r.axes).toHaveLength(0);
    expect(r.mechanism).toBe('');
  });

  it('tracker desconocido: devuelve sistémica', () => {
    const r = applyRules({ title: 'X', type: 'y' }, 'tracker-desconocido');
    expect(r.category).toBe('sistemica');
  });

  it('tracker correcto pero tipo incorrecto: no aplica regla', () => {
    // R01 requiere type: 'policy'; si type es 'economic' no debe matchear
    const r = applyRules({ title: 'Fed Warsh rate decision', type: 'economic' }, 'global-recession-risk');
    // R08 sí podría matchear si hubiera keywords de inflación, pero no aquí
    expect(r.category).toBe('politica-monetaria'); // fallback
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R01 (Fed/FOMC)', () => {
  it('keyword "fed" + type policy + tracker correcto → mora + rentabilidad', () => {
    const r = applyRules(
      { title: 'Fed Chair Warsh Hires Paul Winfree', type: 'policy' },
      'global-recession-risk',
    );
    expect(r.category).toBe('politica-monetaria');
    expect(r.mechanism).toContain('TIIE');
    expect(r.axes.find((a) => a.axis === 'mora')?.direction).toBe('alcista');
    expect(r.axes.find((a) => a.axis === 'rentabilidad')?.direction).toBe('mejora');
  });

  it('keyword "fomc" en título funciona', () => {
    const r = applyRules({ title: 'FOMC hold 99% priced', type: 'policy' }, 'global-recession-risk');
    expect(r.category).toBe('politica-monetaria');
  });

  it('tracker equivocado no activa R01', () => {
    const r = applyRules({ title: 'Fed Warsh rate', type: 'policy' }, 'sheinbaum-presidency');
    expect(r.category).toBe('fiscal'); // fallback sheinbaum
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R02 (aranceles)', () => {
  it('keyword "tariff" + trade → liquidez presion + mora alcista', () => {
    const r = applyRules(
      { title: 'Trump tariff Section 122 cliff approaches', type: 'trade' },
      'global-recession-risk',
    );
    expect(r.category).toBe('externa');
    expect(r.axes.find((a) => a.axis === 'liquidez')?.direction).toBe('presion');
    expect(r.axes.find((a) => a.axis === 'mora')?.direction).toBe('alcista');
  });

  it('funciona desde trump-presidencies también', () => {
    const r = applyRules({ title: 'tariff refunds importers', type: 'trade' }, 'trump-presidencies');
    expect(r.category).toBe('externa');
  });
});

describe('applyRules — R03 (oil)', () => {
  it('keyword "brent" → categoría externa pero axes vacíos', () => {
    const r = applyRules({ title: 'Brent crude falls to $91', type: 'market' }, 'global-recession-risk');
    expect(r.category).toBe('externa');
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R05 (FDI México)', () => {
  it('keyword "fdi" + sheinbaum → liquidez mejora', () => {
    const r = applyRules(
      { title: 'Mexico Q1 FDI hits record $23.6B', type: 'economic' },
      'sheinbaum-presidency',
    );
    expect(r.category).toBe('fiscal');
    expect(r.axes.find((a) => a.axis === 'liquidez')?.direction).toBe('mejora');
  });
});

describe('applyRules — merge de múltiples reglas', () => {
  it('evento que matchea R01 y R08 acumula axes de ambas (first wins por eje)', () => {
    // "inflation" + "fed" en título, type: 'policy' → R01 matchea (policy + fed)
    // R08 requiere type 'economic', no aplica acá
    const r = applyRules(
      { title: 'Fed Warsh inflation target overhaul', type: 'policy' },
      'global-recession-risk',
    );
    expect(r.axes.find((a) => a.axis === 'mora')).toBeDefined();
    expect(r.axes.find((a) => a.axis === 'rentabilidad')).toBeDefined();
  });

  it('R08 (economic + inflation) acumula mora y rentabilidad', () => {
    const r = applyRules(
      { title: 'US PCE inflation 3.3% core hits 3-year high', type: 'economic' },
      'global-recession-risk',
    );
    expect(r.category).toBe('politica-monetaria');
    expect(r.axes.find((a) => a.axis === 'mora')).toBeDefined();
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que pasan**

```bash
cd app && npm test -- watchboard-rules
```

Esperado: todos verdes. Si alguno falla, ajustar keywords o lógica en `watchboard-rules.ts` hasta que pasen.

- [ ] **Step 3: Commit**

```bash
cd app && git add tests/unit/watchboard-rules.test.ts
git commit -m "test(noticias): tests unitarios para applyRules()"
```

---

## Task 3: Restructurar routing de Macro + navegación

**Files:**
- Move: `app/src/pages/macro.astro` → `app/src/pages/macro/index.astro`
- Modify: `app/src/stores/activeTab.ts`
- Modify: `app/src/components/shell/Sidebar.astro`

- [ ] **Step 1: Mover macro.astro a macro/index.astro**

```bash
mkdir -p app/src/pages/macro
mv app/src/pages/macro.astro app/src/pages/macro/index.astro
```

Verificar que `/macro` sigue funcionando:

```bash
cd app && npm run build 2>&1 | tail -5
```

Esperado: build exitoso sin errores de ruta.

- [ ] **Step 2: Actualizar pathToTab en activeTab.ts**

Reemplazar la función `pathToTab`:

```ts
// app/src/stores/activeTab.ts — reemplazar solo la función pathToTab
function pathToTab(path: string): TabId {
  if (path in PATH_TO_TAB) return PATH_TO_TAB[path as keyof typeof PATH_TO_TAB]!;
  if (path.startsWith('/macro/')) return 'macro';
  if (path.startsWith('/instituciones/')) return 'instituciones';
  return 'resumen';
}
```

- [ ] **Step 3: Agregar sub-nav de Macro en Sidebar.astro**

En `app/src/components/shell/Sidebar.astro`, después de la línea:

```ts
const isInstituciones = path.startsWith(`${base}/instituciones`);
```

Agregar:

```ts
const isMacro = path.startsWith(`${base}/macro`);

const MACRO_SUBNAV = [
  {
    href: `${base}/macro`,
    label: 'Indicadores',
    match: new RegExp(`^${base}/macro$`),
  },
  {
    href: `${base}/macro/noticias`,
    label: 'Noticias & Impacto',
    match: new RegExp(`^${base}/macro/noticias`),
  },
];
```

Luego en el JSX del Sidebar, dentro del `.map()` de TABS, localizar el bloque:

```tsx
{isInstEntry && isInstituciones && (
  <div class="instituciones-subnav mx-1 mb-1">
    ...
  </div>
)}
```

Y añadir justo debajo:

```tsx
{href.includes('/macro') && isMacro && (
  <div className="instituciones-subnav mx-1 mb-1">
    {MACRO_SUBNAV.map((item) => {
      const subActive = item.match.test(path);
      return (
        <a
          key={item.href}
          href={item.href}
          data-astro-prefetch
          aria-current={subActive ? 'page' : undefined}
          class:list={['subnav-item', subActive && 'subnav-active']}
        >
          <span class="subnav-dot" aria-hidden="true" />
          {item.label}
        </a>
      );
    })}
  </div>
)}
```

- [ ] **Step 4: Build + verificar navegación**

```bash
cd app && npm run build 2>&1 | tail -10
```

Esperado: sin errores. Rutas `/macro` y `/macro/noticias` ambas aparecen en el output del build.

- [ ] **Step 5: Commit**

```bash
cd app && git add src/pages/macro/index.astro src/stores/activeTab.ts src/components/shell/Sidebar.astro
git commit -m "feat(noticias): restructurar routing macro → macro/index.astro + sub-nav sidebar"
```

---

## Task 4: ContextoBanda.tsx

**Files:**
- Create: `app/src/components/noticias/ContextoBanda.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// app/src/components/noticias/ContextoBanda.tsx
import { useEffect, useState } from 'react';

interface WbKpi {
  id: string;
  label: string;
  value: string;
  color: string;
  delta?: string;
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

const COLOR_CLASS: Record<string, string> = {
  red: '#f85149',
  amber: '#e3b341',
  green: '#56d364',
  blue: '#58a6ff',
};

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
    <div className="rounded-lg border p-3 mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elev)' }}>
      <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-mute)' }}>
        Contexto global · Watchboard
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {kpis.map((kpi) => (
          <div key={kpi.id}>
            <div className="text-[10px] leading-tight" style={{ color: 'var(--color-text-mute)' }}>
              {kpi.label}
            </div>
            <div className="text-sm font-bold leading-tight" style={{ color: COLOR_CLASS[kpi.color] ?? 'var(--color-text)' }}>
              {kpi.value}
              {kpi.delta && (
                <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--color-text-mute)' }}>
                  {kpi.delta}
                </span>
              )}
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

- [ ] **Step 3: Commit**

```bash
cd app && git add src/components/noticias/ContextoBanda.tsx
git commit -m "feat(noticias): ContextoBanda — KPIs de Watchboard global-recession-risk"
```

---

## Task 5: ImpactoTable.tsx + NoticiaCard.tsx

**Files:**
- Create: `app/src/components/noticias/ImpactoTable.tsx`
- Create: `app/src/components/noticias/NoticiaCard.tsx`

- [ ] **Step 1: Crear ImpactoTable.tsx**

```tsx
// app/src/components/noticias/ImpactoTable.tsx
import type { AxisImpact } from '~/data/watchboard-rules';
import { DIRECTION_CONFIG, AXIS_LABEL } from '~/data/watchboard-rules';

interface Props {
  mechanism: string;
  axes: AxisImpact[];
  watchboardUrl: string;
}

export function ImpactoTable({ mechanism, axes, watchboardUrl }: Props) {
  return (
    <div className="mt-3 rounded-md p-3 text-[11px]" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border-soft)' }}>
      <div className="text-[9px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
        Análisis de impacto en SFM
      </div>
      {mechanism && (
        <p className="mb-3 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {mechanism}
        </p>
      )}
      {axes.length > 0 && (
        <table className="w-full mb-3" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="text-[9px]" style={{ color: 'var(--color-text-mute)', borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left py-1 font-semibold">Eje SFM</th>
              <th className="text-center py-1 font-semibold">Dirección</th>
              <th className="text-right py-1 font-semibold">Horizonte</th>
            </tr>
          </thead>
          <tbody>
            {axes.map((ai) => {
              const dir = DIRECTION_CONFIG[ai.direction];
              return (
                <tr key={ai.axis} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td className="py-1" style={{ color: 'var(--color-text)' }}>
                    {AXIS_LABEL[ai.axis]}
                  </td>
                  <td className="text-center py-1 font-semibold" style={{ color: dir.color }}>
                    {dir.symbol} {ai.direction.charAt(0).toUpperCase() + ai.direction.slice(1)}
                  </td>
                  <td className="text-right py-1" style={{ color: 'var(--color-text-mute)' }}>
                    {ai.horizon}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <a
        href={watchboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] hover:underline"
        style={{ color: 'var(--color-accent)' }}
      >
        ↗ Ver evento completo en Watchboard
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Crear NoticiaCard.tsx**

```tsx
// app/src/components/noticias/NoticiaCard.tsx
import { useState, useEffect, useRef } from 'react';
import type { EventImpact } from '~/data/watchboard-rules';
import { CATEGORY_CONFIG, DIRECTION_CONFIG, AXIS_LABEL } from '~/data/watchboard-rules';
import { ImpactoTable } from '~/components/noticias/ImpactoTable';

interface WbSource {
  name: string;
  url: string;
  tier: number;
  pole: string;
}

export interface NoticiaItem {
  id: string;
  date: string;
  title: string;
  type: string;
  sources: WbSource[];
  tracker: string;
  trackerEmoji: string;
  trackerColor: string;
  impact: EventImpact;
}

interface Props {
  item: NoticiaItem;
}

function useCardImage(sourceUrl: string | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sourceUrl) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          fetch(
            `https://api.microlink.io/?url=${encodeURIComponent(sourceUrl)}&meta=true`,
          )
            .then((r) => r.json())
            .then((data: unknown) => {
              const url =
                data &&
                typeof data === 'object' &&
                'data' in data &&
                data.data &&
                typeof data.data === 'object' &&
                'image' in data.data &&
                data.data.image &&
                typeof data.data.image === 'object' &&
                'url' in data.data.image
                  ? (data.data.image.url as string)
                  : null;
              if (url) setImageUrl(url);
            })
            .catch(() => {});
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sourceUrl]);

  return { ref, imageUrl };
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NoticiaCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sourceUrl = item.sources[0]?.url;
  const { ref, imageUrl } = useCardImage(sourceUrl);
  const catCfg = CATEGORY_CONFIG[item.impact.category];
  const hasImpact = item.impact.axes.length > 0 || item.impact.mechanism !== '';

  return (
    <article
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--color-border)', background: 'var(--color-bg-elev)' }}
    >
      {/* Image */}
      <div
        ref={ref}
        className="w-full"
        style={{ aspectRatio: '16/9', background: imageUrl ? 'transparent' : item.trackerColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full"
            style={{ objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span style={{ fontSize: '2.5rem' }}>{item.trackerEmoji}</span>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Category + meta */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span
            className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
            style={{ background: catCfg.bg, color: catCfg.text, borderColor: catCfg.border }}
          >
            {catCfg.label.toUpperCase()}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-text-mute)' }}>
            {formatDate(item.date)}
            {item.sources[0] && ` · ${item.sources[0].name}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug mb-2" style={{ color: 'var(--color-text)' }}>
          {item.title}
        </h3>

        {/* Impact chips */}
        {item.impact.axes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {item.impact.axes.map((ai) => {
              const dir = DIRECTION_CONFIG[ai.direction];
              return (
                <span
                  key={ai.axis}
                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{ background: dir.bg, color: dir.color, borderColor: dir.border }}
                >
                  {dir.symbol} {AXIS_LABEL[ai.axis]}
                </span>
              );
            })}
          </div>
        )}

        {/* Expand toggle */}
        {hasImpact && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] font-medium"
            style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {expanded ? '▾ Ocultar análisis' : '▸ Ver análisis completo →'}
          </button>
        )}

        {/* Expanded block */}
        {expanded && (
          <ImpactoTable
            mechanism={item.impact.mechanism}
            axes={item.impact.axes}
            watchboardUrl="https://watchboard.dev"
          />
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep -E "NoticiaCard|ImpactoTable"
```

Esperado: sin output.

- [ ] **Step 4: Commit**

```bash
cd app && git add src/components/noticias/ImpactoTable.tsx src/components/noticias/NoticiaCard.tsx
git commit -m "feat(noticias): ImpactoTable + NoticiaCard con lazy image via Microlink"
```

---

## Task 6: NoticiasFeed.tsx — island principal

**Files:**
- Create: `app/src/components/noticias/NoticiasFeed.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// app/src/components/noticias/NoticiasFeed.tsx
import { useState, useEffect } from 'react';
import { applyRules } from '~/data/watchboard-rules';
import type { NoticiaCategory } from '~/data/watchboard-rules';
import { CATEGORY_CONFIG } from '~/data/watchboard-rules';
import { NoticiaCard } from '~/components/noticias/NoticiaCard';
import type { NoticiaItem } from '~/components/noticias/NoticiaCard';

interface WbEvent {
  id: string;
  date: string;
  title: string;
  type: string;
  sources: Array<{ name: string; url: string; tier: number; pole: string }>;
}

interface WbEventsResponse {
  events: WbEvent[];
}

const TRACKERS: Array<{
  slug: string;
  emoji: string;
  color: string;
  types?: string[];
}> = [
  { slug: 'global-recession-risk', emoji: '📉', color: '#e67e22' },
  { slug: 'sheinbaum-presidency',  emoji: '🇲🇽', color: '#006847', types: ['economic', 'political'] },
  { slug: 'trump-presidencies',    emoji: '🇺🇸', color: '#3c3b6e', types: ['trade', 'economic'] },
  { slug: 'mexico',                emoji: '🌮', color: '#ce1126', types: ['economic', 'market'] },
];

const ALL_CATEGORIES: Array<{ id: NoticiaCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'politica-monetaria', label: 'Política monetaria' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'externa', label: 'Externa' },
  { id: 'sistemica', label: 'Sistémica' },
];

async function fetchTracker(t: typeof TRACKERS[number]): Promise<NoticiaItem[]> {
  const res = await fetch(
    `https://watchboard.dev/api/v1/events/${t.slug}.json`,
  );
  const data = (await res.json()) as WbEventsResponse;
  const events = data.events ?? [];

  return events
    .filter((e) => !t.types || t.types.includes(e.type))
    .map((e): NoticiaItem => ({
      id: `${t.slug}::${e.id}`,
      date: e.date,
      title: e.title,
      type: e.type,
      sources: e.sources ?? [],
      tracker: t.slug,
      trackerEmoji: t.emoji,
      trackerColor: t.color,
      impact: applyRules(e, t.slug),
    }));
}

export function NoticiasFeed() {
  const [items, setItems] = useState<NoticiaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NoticiaCategory | 'all'>('all');

  useEffect(() => {
    Promise.allSettled(TRACKERS.map(fetchTracker))
      .then((results) => {
        const seen = new Set<string>();
        const all: NoticiaItem[] = [];

        for (const r of results) {
          if (r.status === 'fulfilled') {
            for (const item of r.value) {
              if (!seen.has(item.id)) {
                seen.add(item.id);
                all.push(item);
              }
            }
          }
        }

        all.sort((a, b) => b.date.localeCompare(a.date));
        setItems(all.slice(0, 40));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === 'all'
      ? items
      : items.filter((i) => i.impact.category === activeCategory);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-mute)' }}>
        Cargando noticias…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--color-text-mute)' }}>
        No se pudo conectar con Watchboard. Intenta más tarde.
      </div>
    );
  }

  return (
    <div>
      {/* Category filter pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-4"
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Filtrar por categoría"
      >
        {ALL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const catCfg =
            cat.id !== 'all' ? CATEGORY_CONFIG[cat.id as NoticiaCategory] : null;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id as NoticiaCategory | 'all')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors"
              style={{
                background: isActive
                  ? catCfg?.bg ?? 'var(--color-accent)'
                  : 'transparent',
                color: isActive
                  ? catCfg?.text ?? '#fff'
                  : 'var(--color-text-mute)',
                borderColor: isActive
                  ? catCfg?.border ?? 'var(--color-accent)'
                  : 'var(--color-border)',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-mute)' }}>
          No hay eventos en esta categoría.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <NoticiaCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
cd app && npx tsc --noEmit 2>&1 | grep NoticiasFeed
```

Esperado: sin output.

- [ ] **Step 3: Commit**

```bash
cd app && git add src/components/noticias/NoticiasFeed.tsx
git commit -m "feat(noticias): NoticiasFeed — fetch 4 trackers, merge, filtro por categoría"
```

---

## Task 7: noticias.astro — página completa

**Files:**
- Create: `app/src/pages/macro/noticias.astro`

- [ ] **Step 1: Crear la página**

```astro
---
// app/src/pages/macro/noticias.astro
import Layout from '~/layouts/Layout.astro';
import { datasetJsonLd } from '~/lib/jsonld';
import Header from '~/components/shell/Header.astro';
import BottomNav from '~/components/shell/BottomNav.astro';
import Section from '~/components/chrome/Section.astro';
import EditorialHeadline from '~/components/chrome/EditorialHeadline.astro';
import { ChartDrawer } from '~/components/drawer/ChartDrawer';
import { CmdKPalette } from '~/components/shell/CmdKPalette';
import { UpdateToast } from '~/components/shell/UpdateToast';
import { PWAInstallPrompt } from '~/components/shell/PWAInstallPrompt';
import { OnboardingTour } from '~/components/shell/OnboardingTour';
import { SwipeNav } from '~/components/shell/SwipeNav';
import { PullToRefresh } from '~/components/shell/PullToRefresh';
import { ContextoBanda } from '~/components/noticias/ContextoBanda';
import { NoticiasFeed } from '~/components/noticias/NoticiasFeed';
---

<Layout
  title="Noticias & Impacto Macro"
  description="Feed de eventos macroeconómicos relevantes para el Sistema Financiero Mexicano, con análisis de impacto sobre mora, liquidez, solvencia y rentabilidad."
  jsonLd={datasetJsonLd({
    name: 'Noticias & Impacto Macro — SFM Monitor',
    description: 'Eventos macro globales y México con análisis de impacto en los ejes del SFM.',
    path: '/macro/noticias',
    keywords: ['noticias', 'macro', 'Fed', 'TIIE', 'aranceles', 'SFM', 'impacto financiero'],
  })}
>
  <Header slot="header" />

  <div class="space-y-4">
    <EditorialHeadline
      eyebrow="Macro · Noticias"
      headline="Eventos que mueven el Sistema Financiero Mexicano."
    />
    <p class="text-sm text-(--color-text-mute) -mt-2 max-w-2xl">
      Feed en tiempo real de Watchboard. El análisis de impacto es estimativo y no predictivo.
    </p>

    <Section id="noticias-contexto" title="Contexto global">
      <ContextoBanda client:load />
    </Section>

    <Section id="noticias-feed" title="Eventos recientes">
      <NoticiasFeed client:load />
    </Section>
  </div>

  <SwipeNav client:load />
  <PullToRefresh client:load />
  <ChartDrawer client:load />
  <CmdKPalette client:load />
  <UpdateToast client:load />
  <PWAInstallPrompt client:load />
  <OnboardingTour client:load />

  <BottomNav slot="bottom-nav" />
</Layout>
```

- [ ] **Step 2: Build completo**

```bash
cd app && npm run build 2>&1 | tail -20
```

Esperado: sin errores de TypeScript ni de Astro. La ruta `/macro/noticias` debe aparecer en el output del build.

- [ ] **Step 3: Preview**

```bash
cd app && npm run preview
```

Abrir `http://localhost:4321/macro/noticias` y verificar:
- Sub-nav Macro muestra "Indicadores" y "Noticias & Impacto"
- Banda de contexto carga y muestra 4 KPIs
- Feed carga noticias de Watchboard
- Filtros funcionan

- [ ] **Step 4: Commit**

```bash
cd app && git add src/pages/macro/noticias.astro
git commit -m "feat(noticias): página /macro/noticias — feed Watchboard + banda de contexto"
```

---

## Task 8: Sección en Metodología

**Files:**
- Modify: `app/src/pages/metodologia.astro`

- [ ] **Step 1: Agregar la sección al final del contenido existente**

Localizar el último `</section>` antes del cierre `</div>` principal en `metodologia.astro` y agregar a continuación:

```astro
<!-- Noticias & Impacto -->
<section class="space-y-4 pb-8 border-b border-(--color-border-soft)">
  <div class="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--color-accent)">
    Noticias & Impacto
  </div>
  <h2 class="serif font-semibold text-3xl text-(--color-text) leading-tight">
    Fuente y metodología del feed de noticias
  </h2>
  <p class="text-sm text-(--color-text-dim) leading-relaxed max-w-2xl">
    La sección <strong>Noticias & Impacto</strong> en <code>/macro/noticias</code> consume la
    <a href="https://watchboard.dev/api/" target="_blank" rel="noopener noreferrer" class="text-(--color-accent) hover:underline">API pública de Watchboard</a>
    — plataforma de inteligencia de eventos globales desarrollada por
    <strong>Artemio Padilla</strong> (co-autor del blueprint 2026 de este proyecto).
    La API es gratuita, sin autenticación y con CORS abierto.
  </p>

  <div class="space-y-2">
    <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute)">Trackers monitoreados</div>
    <div class="overflow-x-auto">
      <table class="text-sm w-full max-w-2xl border-collapse">
        <thead>
          <tr class="border-b border-(--color-border)">
            <th class="text-left py-2 pr-4 text-xs text-(--color-text-mute) font-semibold">Tracker</th>
            <th class="text-left py-2 pr-4 text-xs text-(--color-text-mute) font-semibold">Foco temático</th>
            <th class="text-left py-2 text-xs text-(--color-text-mute) font-semibold">Categoría SFM</th>
          </tr>
        </thead>
        <tbody class="text-xs text-(--color-text-dim)">
          <tr class="border-b border-(--color-border-soft)"><td class="py-1.5 pr-4 font-mono">global-recession-risk</td><td class="py-1.5 pr-4">Fed, tasas, aranceles, PMI global</td><td class="py-1.5">Política monetaria / Externa</td></tr>
          <tr class="border-b border-(--color-border-soft)"><td class="py-1.5 pr-4 font-mono">sheinbaum-presidency</td><td class="py-1.5 pr-4">Política económica México (FDI, USMCA, fiscal)</td><td class="py-1.5">Fiscal</td></tr>
          <tr class="border-b border-(--color-border-soft)"><td class="py-1.5 pr-4 font-mono">trump-presidencies</td><td class="py-1.5 pr-4">Aranceles EE.UU., política comercial</td><td class="py-1.5">Externa</td></tr>
          <tr><td class="py-1.5 pr-4 font-mono">mexico</td><td class="py-1.5 pr-4">Macro general México (Pemex, deuda, precios)</td><td class="py-1.5">Sistémica</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="space-y-2 max-w-2xl">
    <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute)">Metodología de reglas de impacto</div>
    <p class="text-sm text-(--color-text-dim) leading-relaxed">
      El análisis de impacto es <strong>estático y determinístico</strong>: cada evento se clasifica
      mediante 10 reglas predefinidas en código (<code>watchboard-rules.ts</code>) que combinan
      el tracker de origen, el tipo de evento y palabras clave en el titular.
      No se utiliza inteligencia artificial en tiempo de ejecución.
    </p>
    <p class="text-sm text-(--color-text-dim) leading-relaxed">
      Las reglas modelan canales de transmisión estándar de política monetaria y riesgo de crédito:
      tasas de interés (Fed → TIIE → IMOR consumo), choques externos (aranceles → FX → liquidez
      empresarial), riesgo soberano (Pemex/déficit → spread bancario → solvencia sistémica).
    </p>
  </div>

  <div class="space-y-2 max-w-2xl">
    <div class="text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-text-mute)">Limitaciones</div>
    <ul class="text-sm text-(--color-text-dim) leading-relaxed list-disc list-inside space-y-1">
      <li>Las reglas capturan el canal de transmisión principal; no modelan escenarios compuestos ni efectos de segunda ronda.</li>
      <li>El horizonte temporal es orientativo, no una proyección cuantitativa.</li>
      <li>El feed muestra los últimos 30 eventos por tracker; no es un archivo histórico exhaustivo.</li>
      <li>Las imágenes de las noticias se obtienen de los artículos fuente vía <a href="https://microlink.io" target="_blank" rel="noopener noreferrer" class="text-(--color-accent) hover:underline">Microlink API</a>.</li>
    </ul>
  </div>
</section>
```

- [ ] **Step 2: Build**

```bash
cd app && npm run build 2>&1 | tail -5
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
cd app && git add src/pages/metodologia.astro
git commit -m "docs(metodologia): sección Noticias & Impacto — fuente Watchboard y metodología de reglas"
```

---

## Task 9: CHANGELOG + verificación final de criterios

**Files:**
- Modify: `CHANGELOG.md` (raíz del repo)

- [ ] **Step 1: Agregar entrada en [Sin publicar]**

En `CHANGELOG.md`, bajo la sección `[Sin publicar]` > `### Agregado`, añadir:

```markdown
- **`/macro/noticias`** — nueva sub-página "Noticias & Impacto": feed de eventos macro de Watchboard API (4 trackers: `global-recession-risk`, `sheinbaum-presidency`, `trump-presidencies`, `mexico`) con análisis de impacto estático sobre ejes SFM (mora/liquidez/solvencia/rentabilidad) mediante 10 reglas en `watchboard-rules.ts`. Imágenes lazy via Microlink con fallback a emoji. Banda de contexto con 4 KPIs de `global-recession-risk`. Cierra #100.
- Sub-nav Macro en Sidebar: "Indicadores" + "Noticias & Impacto".
- Sección "Noticias & Impacto" en `/metodologia` con fuentes, tabla de trackers y limitaciones.
```

- [ ] **Step 2: Verificar criterios de aceptación del spec**

Correr el build y checar cada punto de la lista:

```bash
cd app && npm run build
```

Checklist manual (requiere `npm run preview` y abrir el browser):

- [ ] `/macro/noticias` carga sin errores en desktop y móvil
- [ ] Sub-nav Macro muestra "Indicadores" y "Noticias & Impacto"
- [ ] Banda de contexto muestra 4 KPIs con color correcto
- [ ] Feed muestra eventos de los 4 trackers mezclados, ordenados por fecha
- [ ] Filtros por categoría funcionan
- [ ] Chips de impacto visibles en estado colapsado
- [ ] Tabla de ejes SFM visible al expandir
- [ ] Imágenes cargan lazy; fallback a emoji visible si Microlink falla (probar con DevTools → red lenta)
- [ ] Link "Ver evento en Watchboard" abre en tab nueva
- [ ] Sección "Noticias & Impacto" visible en `/metodologia`

- [ ] **Step 3: Correr tests unitarios**

```bash
cd app && npm test
```

Esperado: todos los tests pasan (incluyendo los nuevos de `watchboard-rules`).

- [ ] **Step 4: Commit final**

```bash
git add CHANGELOG.md
git commit -m "chore: CHANGELOG — feat Noticias & Impacto /macro/noticias (issue #100)"
```

---

## Mejoras pendientes — fase 2 (continuación)

> Identificadas tras primer deploy. Agrupar en un PR de polish antes de v0.2.0.

### M1: Layout en cuadrícula y cards más compactas

**Problema:** El feed muestra las cards en lista vertical ancha. En desktop se desperdicia espacio; en móvil las cards son muy altas y requieren mucho scroll.

**Solución:**
- En `NoticiasFeed.tsx`: cambiar `flex flex-col gap-4` por `grid grid-cols-1 sm:grid-cols-2 gap-3` en el contenedor del feed.
- En `NoticiaCard.tsx`: reducir padding de `p-3` a `p-2.5`, título de `text-sm` a `text-xs font-semibold`, chips de impacto a `text-[8px]`, imagen de `16/9` a `3/2` (más compacta en cuadrícula).
- El expand de análisis se mantiene igual — se abre en la misma card ocupando el ancho de su columna.

**Files:** `app/src/components/noticias/NoticiasFeed.tsx`, `app/src/components/noticias/NoticiaCard.tsx`

---

### M2: Link directo a la noticia fuente (no al home de Watchboard)

**Problema actual:** El botón "Ver evento completo en Watchboard" enlaza a `https://watchboard.dev` (home), porque la API v1 no expone URLs de evento.

**Opciones investigadas:**
1. **`sources[0].url`** — el artículo fuente original (Reuters, Bloomberg, AP). Ya disponible en `NoticiaItem.sources`. Es el enlace más directo y útil para el usuario.
2. **Permalink Watchboard** — el `id` del evento es un slug legible (ej. `triple-cb-week-preview-...`). Posible URL: `https://watchboard.dev/trackers/{tracker}/events/{id}`. **No confirmado** — requiere verificar manualmente en el sitio si estas URLs existen.

**Solución recomendada (segura):**
- En `ImpactoTable.tsx`: cambiar el link a `sources[0].url` si existe, con label "↗ Leer artículo fuente". Si no hay fuente, ocultar el link.
- En `NoticiaCard.tsx`: pasar `sourceUrl={item.sources[0]?.url}` a `ImpactoTable`.
- En `ImpactoTable` props: añadir `sourceUrl?: string` y usarla en lugar de `watchboardUrl`.

**Cambio en `NoticiaItem`:** No se necesita — `sources[0].url` ya está en la interfaz.

**Files:** `app/src/components/noticias/ImpactoTable.tsx`, `app/src/components/noticias/NoticiaCard.tsx`

---

### M3: Rediseñar ContextoBanda — menos texto, más visual

**Problema:** La banda de contexto actual muestra `label` + `value` + `delta` en texto plano. Los labels son largos (venían del API), `delta` puede ser texto raro, y sin contexto visual parece una lista de errores o datos crudos.

**Solución:**
- **Truncar labels**: máximo 28 caracteres con `…` usando una función de truncado.
- **Eliminar `delta`** del render (era demasiado verboso para una banda compacta).
- **Añadir indicador de color**: un punto de color (`●`) antes del valor en lugar del texto de color actual, para que sea visualmente más inmediato.
- **Layout más compacto**: reducir `gap-y-2` a `gap-y-1`, tamaño de valor de `text-sm` a `text-xs font-bold`.
- **Título de la banda**: cambiar "Contexto global · Watchboard" por "Contexto global" con un link pequeño "via Watchboard ↗" a un lado.
- Si el API devuelve 0 KPIs válidos, la banda ya retorna `null` — mantener ese comportamiento.

**Ejemplo del antes/después:**

```
Antes:
  US Recession Probability (Goldman Sachs Model)
  15%   ↓ Goldman...

Después:
  ● Riesgo recesión EE.UU.
    15%
```

**Files:** `app/src/components/noticias/ContextoBanda.tsx`

---

### M4: Imágenes rotas — mejorar robustez del fallback

**Problema:** Algunas imágenes cargadas via Microlink se muestran rotas (el tag `<img>` existe pero la URL falla — 404, CORS, etc.). El emoji fallback solo se muestra cuando Microlink no devuelve `data.image.url`, pero si devuelve una URL inválida, queda roto.

**Solución:**
- En `NoticiaCard.tsx`, dentro del `<img>`, añadir `onError` handler que borre la `imageUrl` y fuerce el fallback al emoji:
  ```tsx
  onError={() => setImageUrl(null)}
  ```
- Esto convierte cualquier imagen rota en un emoji visible en lugar de un ícono de imagen rota del browser.

**Files:** `app/src/components/noticias/NoticiaCard.tsx`

---

### Orden de implementación sugerido

M4 (1 línea, máximo impacto) → M3 (visual, independiente) → M2 (link útil) → M1 (layout, más cambios)
