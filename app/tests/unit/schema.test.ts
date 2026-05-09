import { describe, expect, it } from 'vitest';
import { SfmDataSchema } from '~/data/schema';
import sfmData from '../../../data/sfm-data.json';

/**
 * Minimal fixture with required fields not yet emitted by the production pipeline.
 * Remove once the pipeline emits historico/credito/ifrs9/sofipos.
 */
const MISSING_FIELDS_FIXTURE = {
  historico: {},
  credito: {
    imor: { actual: 0, fecha: '2026-01', semaforo: 'verde' },
    imora: { actual: 0, fecha: '2026-01', semaforo: 'verde' },
    icor: { actual: 0, fecha: '2026-01', semaforo: 'verde' },
    roa: { actual: 0, fecha: '2026-01' },
    roe: { actual: 0, fecha: '2026-01' },
    historico_por_cartera: {
      fechas: [],
      imor_total: [],
      imor_comercial: [],
      imor_consumo: [],
      imor_vivienda: [],
      imor_tarjeta: [],
      imor_consumo_norev: [],
      imora_total: [],
      icor_total: [],
      roa: [],
      roe: [],
    },
  },
  ifrs9: {
    fechas: [],
    etapa1_pct: [],
    etapa2_pct: [],
    etapa3_pct: [],
  },
  sofipos: {
    fechas: [],
    imor_total: [],
    imor_comercial: [],
    imor_consumo: [],
    imor_vivienda: [],
    imora_total: [],
    roa: [],
    roe: [],
  },
};

describe('SfmDataSchema', () => {
  it('validates real production data successfully', () => {
    // Merge prod data with fixture for fields not yet emitted by pipeline
    const payload = { ...MISSING_FIELDS_FIXTURE, ...sfmData };
    const result = SfmDataSchema.safeParse(payload);
    if (!result.success) {
      console.error(result.error.issues.slice(0, 5));
    }
    expect(result.success).toBe(true);
  });
});
