import type { SfmData } from './schema';
import type { IndicatorId } from './indicators';

export type AlertSeverity = 'green' | 'yellow' | 'red';

export interface Alert {
  id: string;
  label: string;
  severity: AlertSeverity;
  indicatorId: IndicatorId;
}

const INFLATION_TARGET = 3.0;
const INFLATION_BAND = 1.0;

export function computeAlerts(data: SfmData): Alert[] {
  const alerts: Alert[] = [];

  // Inflation out of Banxico target band
  const inflationLatest = Number(data.inflacion.actual);
  if (
    Number.isFinite(inflationLatest) &&
    Math.abs(inflationLatest - INFLATION_TARGET) > INFLATION_BAND
  ) {
    const above = inflationLatest > INFLATION_TARGET + INFLATION_BAND;
    alerts.push({
      id: 'inflation-out-of-band',
      label: above
        ? `Inflación ${inflationLatest.toFixed(2)}% sobre rango Banxico (3% ±1pp)`
        : `Inflación ${inflationLatest.toFixed(2)}% bajo rango Banxico (3% ±1pp)`,
      severity: above ? 'yellow' : 'green',
      indicatorId: 'inflacion',
    });
  }

  // IFRS 9 Etapa 2 rising trend over last 6 observations
  const stage2 = data.ifrs9.etapa2_pct;
  if (Array.isArray(stage2) && stage2.length >= 6) {
    const recent = stage2.slice(-6);
    const first = recent[0]!;
    const last = recent[recent.length - 1]!;
    const monotonic = recent.every(
      (v, idx) => idx === 0 || v >= recent[idx - 1]!,
    );
    if (monotonic && last - first >= 0.2) {
      alerts.push({
        id: 'ifrs9-stage2-rising',
        label: `IFRS 9 Etapa 2 al alza (${first.toFixed(1)} → ${last.toFixed(1)})`,
        severity: 'yellow',
        indicatorId: 'ifrs9',
      });
    }
  }

  return alerts;
}
