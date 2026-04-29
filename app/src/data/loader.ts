import rawData from '../../../data/sfm-data.json';
import { SfmDataSchema, type SfmData } from './schema';

/**
 * Build-time loader: parses & validates `data/sfm-data.json` exactly once.
 * Throws at build time if the schema doesn't match — fail loud, fail early.
 *
 * The JSON lives at the repo root so it's shared with the legacy `index.html`
 * during migration. Both consumers read from the same source of truth.
 */
let cached: SfmData | null = null;

/**
 * Stubs for CNBV-sourced sections not yet emitted by the data pipeline.
 * These allow the build to succeed while charts gracefully show empty states.
 * Remove each stub once the pipeline populates the corresponding field.
 */
const DATA_STUBS = {
  historico: {},
  credito: {
    imor:  { actual: 0, fecha: 'N/D' },
    imora: { actual: 0, fecha: 'N/D' },
    icor:  { actual: 0, fecha: 'N/D' },
    roa:   { actual: 0, fecha: 'N/D' },
    roe:   { actual: 0, fecha: 'N/D' },
    historico_por_cartera: {
      fechas: [], imor_total: [], imor_comercial: [], imor_consumo: [],
      imor_vivienda: [], imor_tarjeta: [], imor_consumo_norev: [],
      imora_total: [], icor_total: [], roa: [], roe: [],
    },
  },
  ifrs9: {
    fechas: [], etapa1_pct: [], etapa2_pct: [], etapa3_pct: [],
  },
  sofipos: {
    fechas: [], imor_total: [], imor_comercial: [], imor_consumo: [],
    imor_vivienda: [], imora_total: [], roa: [], roe: [],
    ultima: { fecha: 'N/D', imor_total: 0, imor_comercial: 0, imor_consumo: 0, imor_vivienda: 0, imora_total: 0, roa: 0, roe: 0 },
  },
} as const;

export function loadSfmData(): SfmData {
  if (cached) return cached;
  const raw = rawData as Record<string, unknown>;
  const merged = {
    ...DATA_STUBS,
    ...raw,
    historico: { ...DATA_STUBS.historico,  ...(typeof raw['historico']  === 'object' && raw['historico']  !== null ? raw['historico']  as object : {}) },
    credito:   { ...DATA_STUBS.credito,    ...(typeof raw['credito']    === 'object' && raw['credito']    !== null ? raw['credito']    as object : {}) },
    ifrs9:     { ...DATA_STUBS.ifrs9,      ...(typeof raw['ifrs9']      === 'object' && raw['ifrs9']      !== null ? raw['ifrs9']      as object : {}) },
    sofipos:   { ...DATA_STUBS.sofipos,    ...(typeof raw['sofipos']    === 'object' && raw['sofipos']    !== null ? raw['sofipos']    as object : {}) },
  };
  const parsed = SfmDataSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `sfm-data.json failed schema validation:\n${issues}\n` +
        `(${parsed.error.issues.length} total issues)`,
    );
  }
  cached = parsed.data;
  return cached;
}
