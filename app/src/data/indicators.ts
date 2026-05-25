export type IndicatorId =
  | 'fx'
  | 'tasa'
  | 'inflacion'
  | 'imor'
  | 'imora'
  | 'icor'
  | 'roa'
  | 'roe'
  | 'tiie28'
  | 'ifrs9'
  | 'sofipos-imor'
  | 'sofipos-imora'
  | 'sofipos-roa'
  | 'tiie'
  | 'cetes'
  | 'spread-tiie-cetes'
  | 'reservas'
  | 'udi';

export type Tone = 'gold' | 'green' | 'yellow' | 'red';

export interface Indicator {
  id: IndicatorId;
  label: string;
  shortLabel: string;
  aliases: readonly string[];
  unit: string;
  source: string;
  /** Tab where this indicator's chart lives. */
  tab: 'mercado' | 'credito' | 'sofipos' | 'macro';
  tone: Tone;
  /** Whether 'up' means good for this metric (e.g. coverage ratios). */
  upIsGood: boolean;
  /** Brief methodology shown in drawer. */
  description: string;
  /** Banxico SIE / CNBV code for monospace tag. */
  refCode?: string | undefined;
}

export const INDICATORS: readonly Indicator[] = [
  {
    id: 'fx',
    label: 'Tipo de cambio MXN/USD (FIX)',
    shortLabel: 'MXN/USD',
    aliases: ['fx', 'mxn', 'usd', 'tipo de cambio', 'sf43718', 'fix'],
    unit: 'MXN',
    source: 'Banco de México, SIE, serie SF43718',
    tab: 'mercado',
    tone: 'gold',
    upIsGood: false,
    description:
      'Tipo de cambio para solventar obligaciones denominadas en dólares (FIX). Publicado diariamente por Banxico a las 12:00.',
    refCode: 'SF43718',
  },
  {
    id: 'tasa',
    label: 'Tasa objetivo Banxico',
    shortLabel: 'Tasa Banxico',
    aliases: ['tasa', 'banxico', 'objetivo', 'política', 'sf61745'],
    unit: '%',
    source: 'Banco de México, SIE, serie SF61745',
    tab: 'mercado',
    tone: 'red',
    upIsGood: false,
    description:
      'Tasa de política monetaria fijada por la Junta de Gobierno. Cambia por decisión, no diariamente.',
    refCode: 'SF61745',
  },
  {
    id: 'tiie28',
    label: 'TIIE 28 días',
    shortLabel: 'TIIE 28d',
    aliases: ['tiie', 'tiie28', 'sf43783'],
    unit: '%',
    source: 'Banco de México, SIE, serie SF43783',
    tab: 'mercado',
    tone: 'red',
    upIsGood: false,
    description:
      'Tasa de Interés Interbancaria de Equilibrio a 28 días. Referencia para créditos bancarios.',
    refCode: 'SF43783',
  },
  {
    id: 'inflacion',
    label: 'Inflación anual (INPC)',
    shortLabel: 'Inflación',
    aliases: ['inflacion', 'inpc', 'sp74625', 'precios'],
    unit: '%',
    source: 'Banco de México, SIE, serie SP74625',
    tab: 'macro',
    tone: 'yellow',
    upIsGood: false,
    description:
      'Variación anual del Índice Nacional de Precios al Consumidor. Objetivo Banxico 3% ±1pp.',
    refCode: 'SP74625',
  },
  {
    id: 'imor',
    label: 'IMOR Banca Múltiple',
    shortLabel: 'IMOR Banca',
    aliases: ['imor', 'cartera vencida', 'morosidad'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: false,
    description:
      'Índice de Morosidad: cartera vencida (Etapa 3) / cartera total. Métrica regulatoria principal de calidad crediticia.',
  },
  {
    id: 'imora',
    label: 'IMORA Banca Múltiple',
    shortLabel: 'IMORA',
    aliases: ['imora', 'morosidad ajustada'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: false,
    description:
      'IMOR Ajustado: incluye castigos de los últimos 12 meses. Métrica preferida por Banxico — no manipulable por write-offs.',
  },
  {
    id: 'icor',
    label: 'ICOR Banca Múltiple',
    shortLabel: 'ICOR',
    aliases: ['icor', 'cobertura', 'reservas'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description:
      'Índice de Cobertura: reservas EPRC / cartera vencida. >100% indica reservas suficientes.',
  },
  {
    id: 'roa',
    label: 'ROA Banca Múltiple',
    shortLabel: 'ROA',
    aliases: ['roa', 'return on assets', 'rentabilidad'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description: 'Utilidad neta / activos totales (12 meses).',
  },
  {
    id: 'roe',
    label: 'ROE Banca Múltiple',
    shortLabel: 'ROE',
    aliases: ['roe', 'return on equity'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 40',
    tab: 'credito',
    tone: 'green',
    upIsGood: true,
    description: 'Utilidad neta / capital contable (12 meses).',
  },
  {
    id: 'ifrs9',
    label: 'IFRS 9 — Etapas 1/2/3',
    shortLabel: 'IFRS 9',
    aliases: ['ifrs9', 'etapas', 'sicr', 'r12a'],
    unit: '%',
    source: 'CNBV, Reporte R12A',
    tab: 'credito',
    tone: 'yellow',
    upIsGood: false,
    description:
      'Distribución de cartera por etapa de riesgo. Etapa 2 (SICR) en alza es señal de deterioro temprano.',
  },
  {
    id: 'sofipos-imor',
    label: 'SoFiPOs — IMOR top 15',
    shortLabel: 'SoFi IMOR',
    aliases: ['sofipos', 'sofi', 'sociedades populares'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'yellow',
    upIsGood: false,
    description:
      'IMOR de las 15 SoFiPOs más grandes por activo. Sector con morosidad ~4× la de Banca Múltiple.',
  },
  {
    id: 'sofipos-imora',
    label: 'SoFiPOs — IMORA',
    shortLabel: 'SoFi IMORA',
    aliases: ['sofipos imora'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'yellow',
    upIsGood: false,
    description: 'IMORA agregado del sector SoFiPOs.',
  },
  {
    id: 'sofipos-roa',
    label: 'SoFiPOs — ROA',
    shortLabel: 'SoFi ROA',
    aliases: ['sofipos roa'],
    unit: '%',
    source: 'CNBV, Portafolio de Información, Sector 50',
    tab: 'sofipos',
    tone: 'red',
    upIsGood: true,
    description: 'ROA agregado SoFiPOs. Sector reportó pérdidas en 2025.',
  },
  {
    id: 'tiie',
    label: 'TIIE Fondeo',
    shortLabel: 'TIIE',
    aliases: ['tiie fondeo', 'tasa interbancaria', 'overnight'],
    unit: '%',
    source: 'Banco de México, SIE, SF43783',
    refCode: 'SF43783',
    tab: 'mercado',
    tone: 'gold',
    upIsGood: false,
    description: 'Tasa de Interés Interbancaria de Equilibrio al Fondeo. Tasa diaria del mercado overnight.',
  },
  {
    id: 'cetes',
    label: 'Cetes 28 días',
    shortLabel: 'Cetes 28d',
    aliases: ['cetes', 'cetes 28d', 'certificados de tesoreria'],
    unit: '%',
    source: 'Banco de México, SIE, SF43936',
    refCode: 'SF43936',
    tab: 'mercado',
    tone: 'yellow',
    upIsGood: false,
    description: 'Rendimiento de Cetes a 28 días en subasta primaria semanal.',
  },
  {
    id: 'spread-tiie-cetes',
    label: 'Spread TIIE-Cetes',
    shortLabel: 'Spread',
    aliases: ['spread', 'spread interbancario', 'tension interbancaria'],
    unit: 'pp',
    source: 'Banco de México, SIE',
    tab: 'mercado',
    tone: 'yellow',
    upIsGood: false,
    description: 'Diferencial entre TIIE Fondeo y Cetes 28d. Señal de tensión en el mercado interbancario.',
  },
  {
    id: 'reservas',
    label: 'Reservas Internacionales',
    shortLabel: 'Reservas',
    aliases: ['reservas', 'reservas internacionales', 'activos internacionales'],
    unit: 'B USD',
    source: 'Banco de México, SIE, SF43707',
    refCode: 'SF43707',
    tab: 'mercado',
    tone: 'green',
    upIsGood: true,
    description: 'Activos internacionales netos del Banco de México. Colchón ante choques externos.',
  },
  {
    id: 'udi',
    label: 'UDI',
    shortLabel: 'UDI',
    aliases: ['udi', 'unidad de inversion', 'inflacion acumulada'],
    unit: 'MXN',
    source: 'Banco de México, SIE',
    tab: 'mercado',
    tone: 'yellow',
    upIsGood: false,
    description: 'Unidad de Inversión — unidad de cuenta indexada a la inflación (INPC).',
  },
];

const BY_ID = new Map<IndicatorId, Indicator>(
  INDICATORS.map((i) => [i.id, i]),
);

export function getIndicator(id: string): Indicator | undefined {
  return BY_ID.get(id as IndicatorId);
}

export function searchIndicators(query: string): Indicator[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return INDICATORS.filter((i) => {
    if (i.id.includes(q)) return true;
    if (i.label.toLowerCase().includes(q)) return true;
    if (i.refCode && i.refCode.toLowerCase().includes(q)) return true;
    return i.aliases.some((a) => a.toLowerCase().includes(q));
  });
}
