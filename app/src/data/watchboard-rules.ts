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
