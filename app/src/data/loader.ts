import rawData from '../../../data/sfm-data.json';
import { SfmDataSchema, type SfmData } from './schema';

/**
 * Build-time loader: parses & validates data JSONs exactly once.
 * Throws at build time if any schema doesn't match — fail loud, fail early.
 *
 * Data sources:
 *   data/sfm-data.json   — Banxico (tipo_cambio, tasa_banxico, inflacion)  ← auto-updated daily
 *   data/credito.json    — CNBV banca múltiple (credito section)           ← updated by normalize-cnbv.py
 *   data/sofipos.json    — CNBV SoFiPOs (sofipos section)                  ← updated by normalize-cnbv.py
 */
let cached: SfmData | null = null;

/**
 * Stubs for CNBV-sourced sections when their JSON files are absent.
 * Charts render empty states gracefully. Remove once pipeline populates the files.
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

// Dynamically import CNBV JSON files. These are optional — if absent, stubs are used.
// Using dynamic import + try/catch so a missing file is a graceful degradation,
// not a build error. Astro SSG bundles whatever is available at build time.
async function tryImportCnbv(): Promise<{
  credito: Record<string, unknown> | null;
  sofipos: Record<string, unknown> | null;
}> {
  let credito: Record<string, unknown> | null = null;
  let sofipos: Record<string, unknown> | null = null;

  try {
    const mod = await import('../../../data/credito.json');
    credito = (mod as { default: Record<string, unknown> }).default;
  } catch {
    // credito.json not yet generated — stub will be used
  }

  try {
    const mod = await import('../../../data/sofipos.json');
    sofipos = (mod as { default: Record<string, unknown> }).default;
  } catch {
    // sofipos.json not yet generated — stub will be used
  }

  return { credito, sofipos };
}

const cnbv = await tryImportCnbv();

export function loadSfmData(): SfmData {
  if (cached) return cached;

  const raw = rawData as Record<string, unknown>;

  const merged = {
    ...DATA_STUBS,
    ...raw,
    historico: {
      ...DATA_STUBS.historico,
      ...(typeof raw['historico'] === 'object' && raw['historico'] !== null
        ? (raw['historico'] as object)
        : {}),
    },
    // CNBV sections: prefer data from dedicated JSON files (real data),
    // fall back to stub if file is absent, then merge any fields from sfm-data.json
    credito: {
      ...DATA_STUBS.credito,
      ...(cnbv.credito ?? {}),
      ...(typeof raw['credito'] === 'object' && raw['credito'] !== null
        ? (raw['credito'] as object)
        : {}),
    },
    sofipos: {
      ...DATA_STUBS.sofipos,
      ...(cnbv.sofipos ?? {}),
      ...(typeof raw['sofipos'] === 'object' && raw['sofipos'] !== null
        ? (raw['sofipos'] as object)
        : {}),
    },
    ifrs9: {
      ...DATA_STUBS.ifrs9,
      ...(typeof raw['ifrs9'] === 'object' && raw['ifrs9'] !== null
        ? (raw['ifrs9'] as object)
        : {}),
    },
  };

  const parsed = SfmDataSchema.safeParse(merged);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `SFM data failed schema validation:\n${issues}\n` +
        `(${parsed.error.issues.length} total issues)`,
    );
  }
  cached = parsed.data;
  return cached;
}
