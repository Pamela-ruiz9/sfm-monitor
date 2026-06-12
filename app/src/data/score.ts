import type { SfmData, MonthlyPointT } from './schema';

export interface SfmScore {
  value: number;           // 0–1 composite score
  label: string;           // "Riesgo Bajo", "Riesgo Contenido", etc.
  color: string;           // hex
  subindices: {
    credito: number;       // 0–1 S_credito
    rentabilidad: number;  // 0–1 S_rentabilidad
    macro: number;         // 0–1 S_macro
  };
  kpis: {
    imor: number;
    imora: number;
    icor: number;
    roa: number;
    roe: number;
    fx: number;
    inflacion: number;
    tasaReal: number;
  };
  periodo: string;         // 'YYYY-MM' of latest data
}

// ---------- color thresholds ----------

function scoreToLabel(value: number): string {
  if (value < 0.20) return 'Riesgo Bajo';
  if (value < 0.40) return 'Riesgo Contenido';
  if (value < 0.60) return 'Riesgo Moderado';
  if (value < 0.80) return 'Riesgo Elevado';
  return 'Riesgo Alto';
}

function scoreToColor(value: number): string {
  if (value < 0.20) return '#56d364';
  if (value < 0.40) return '#d4a72c';
  if (value < 0.60) return '#e3b341';
  if (value < 0.80) return '#f0883e';
  return '#f85149';
}

// ---------- normalization helpers ----------

/**
 * Compute the rolling empirical percentile score for the last non-null value in `series`.
 * For each observation at index t, rank x_t among all non-null observations in [0..t].
 * Returns value in [0, 1].
 *
 * @param series          Array of values, may contain nulls
 * @param higherIsBetter  If true, higher values = lower stress → return 1 - rank
 */
function normSeries(series: readonly (number | null)[], higherIsBetter: boolean): number {
  // Find last non-null value and its index
  let lastIdx = -1;
  let lastVal: number | null = null;
  for (let i = series.length - 1; i >= 0; i--) {
    const v = series[i] ?? null;
    if (v !== null) {
      lastIdx = i;
      lastVal = v;
      break;
    }
  }

  if (lastIdx === -1 || lastVal === null) {
    // No non-null values — return 0.5 as neutral fallback
    return 0.5;
  }

  // Collect non-null values from series[0..lastIdx] inclusive
  const population: number[] = [];
  for (let i = 0; i <= lastIdx; i++) {
    const v = series[i] ?? null;
    if (v !== null) {
      population.push(v);
    }
  }

  if (population.length === 0) {
    return 0.5;
  }

  // Average rank for ties: (countBelow + 0.5 * countEqual + 0.5) / population.length
  let countBelow = 0;
  let countEqual = 0;
  for (const v of population) {
    if (v < lastVal) countBelow++;
    else if (v === lastVal) countEqual++;
  }

  const rankFraction = (countBelow + 0.5 * countEqual + 0.5) / population.length;
  const result = Math.max(0, Math.min(1, rankFraction));
  return higherIsBetter ? 1 - result : result;
}

/**
 * Same as normSeries but caps values at `cap` before computing percentile.
 */
function normSeriesCapped(
  series: readonly (number | null)[],
  higherIsBetter: boolean,
  cap: number,
): number {
  const capped: (number | null)[] = series.map((v) => (v !== null ? Math.min(v, cap) : null));
  return normSeries(capped, higherIsBetter);
}

// ---------- public API ----------

export function computeScore(data: SfmData): SfmScore {
  const cartera = data.credito.historico_por_cartera;

  // --- Crédito sub-index ---
  const imor_norm = normSeries(cartera.imor_total, false);
  const imora_norm = normSeries(cartera.imora_total, false);
  // ICOR: cap at 20, higher coverage = better = less stress → invert
  const icor_norm = normSeriesCapped(cartera.icor_total, true, 20);

  // --- Rentabilidad sub-index ---
  // Higher ROA / ROE = better = less stress → invert
  const roa_norm = normSeries(cartera.roa, true);
  const roe_norm = normSeries(cartera.roe, true);

  // --- Macro sub-index ---
  // FX: higher peso/dollar rate = more depreciation = more stress → don't invert
  const fxValues: (number | null)[] = data.tipo_cambio.historico_mensual.map(
    (pt: MonthlyPointT) => pt.valor,
  );
  const fx_norm = normSeries(fxValues, false);

  // Inflation: distance from Banxico target (3%)
  const inflacion = Number(data.inflacion.actual);
  const inflacionNorm = Math.min(Math.abs(inflacion - 3.0) / 3.0, 1.0);

  // Tasa real vs neutral r* = 2.5%
  const tasaBanxico = Number(data.tasa_banxico.actual);
  const tasaReal = tasaBanxico - inflacion;
  const tasaRealNorm = Math.min(Math.abs(tasaReal - 2.5) / 3.0, 1.0);

  // --- Sub-indices ---
  const S_credito = (imor_norm + imora_norm + icor_norm) / 3;
  const S_rentabilidad = (roa_norm + roe_norm) / 2;
  const S_macro = (fx_norm + inflacionNorm + tasaRealNorm) / 3;

  // --- Composite score ---
  const value = 0.50 * S_credito + 0.30 * S_rentabilidad + 0.20 * S_macro;

  // --- Periodo ---
  const fechas = cartera.fechas;
  const periodo = fechas[fechas.length - 1] ?? 'N/D';

  return {
    value,
    label: scoreToLabel(value),
    color: scoreToColor(value),
    subindices: {
      credito: S_credito,
      rentabilidad: S_rentabilidad,
      macro: S_macro,
    },
    kpis: {
      imor: imor_norm,
      imora: imora_norm,
      icor: icor_norm,
      roa: roa_norm,
      roe: roe_norm,
      fx: fx_norm,
      inflacion: inflacionNorm,
      tasaReal: tasaRealNorm,
    },
    periodo,
  };
}
