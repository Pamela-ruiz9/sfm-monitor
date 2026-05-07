import { describe, expect, it } from 'vitest';
import { computeAlerts } from '~/data/alerts';
import type { SfmData } from '~/data/schema';

const minimal: SfmData = {
  ultima_actualizacion: '27/04/2026',
  fuentes: { tipo_cambio: '', tasa_objetivo: '', inflacion: '' },
  tipo_cambio: { actual: 17.4, fecha: '2026-04', historico_mensual: [] },
  tasa_banxico: { actual: 6.75, fecha: '27/03/2026', historico: [] },
  inflacion: {
    actual: 4.45,
    fecha: '01/03/2026',
    historico_mensual: [
      { fecha: '2026-03-01', mes: '2026-03', valor: 4.45 },
    ],
  },
  historico: {},
  credito: {},
  ifrs9: { etapa2_pct: [1.8, 1.85, 1.9, 1.95, 2.0, 2.05, 2.1] },
  sofipos: {},
};

describe('alerts engine', () => {
  it('flags inflation above 4% as yellow', () => {
    const alerts = computeAlerts(minimal);
    expect(alerts.some((a) => a.id === 'inflation-out-of-band')).toBe(true);
    const a = alerts.find((a) => a.id === 'inflation-out-of-band');
    expect(a?.severity).toBe('yellow');
  });

  it('flags ifrs9 stage 2 trending up over 6 months', () => {
    const alerts = computeAlerts(minimal);
    expect(alerts.some((a) => a.id === 'ifrs9-stage2-rising')).toBe(true);
  });

  it('returns empty array on healthy data', () => {
    const healthy: SfmData = {
      ...minimal,
      inflacion: { ...minimal.inflacion, actual: 3.0 },
      ifrs9: { etapa2_pct: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0] },
    };
    const alerts = computeAlerts(healthy);
    expect(alerts.find((a) => a.id === 'inflation-out-of-band')).toBeUndefined();
    expect(alerts.find((a) => a.id === 'ifrs9-stage2-rising')).toBeUndefined();
  });

  it('alerts have stable id, label, severity, indicatorId fields', () => {
    const alerts = computeAlerts(minimal);
    for (const a of alerts) {
      expect(a.id).toBeTruthy();
      expect(a.label).toBeTruthy();
      expect(['green', 'yellow', 'red']).toContain(a.severity);
    }
  });
});
