/**
 * RiskHeatmap — Issue #34
 *
 * Heatmap de riesgo sistémico del SFM.
 * Metodología: percentil rolling histórico por indicador, semáforo compuesto
 * por dimensión. Inspirado en el Mapa Térmico de Riesgos del REF Banxico
 * (Recuadro 3, octubre 2018) y el ESRB Risk Dashboard.
 *
 * Dimensiones:
 *   Crédito    → IMOR, IMORA, ICOR
 *   Rentabilidad → ROA, ROE
 *   Mercado    → FX (nivel), Tasa Banxico, Inflación
 *   Liquidez   → Reservas internacionales (proxy)
 *
 * Colores (heat semáforo):
 *   Verde  → percentil bajo (riesgo bajo)
 *   Amarillo → percentil medio
 *   Rojo   → percentil alto (riesgo elevado)
 *
 * Nota: para indicadores donde *mayor valor = mayor riesgo* (IMOR, inflación, FX depreciation)
 *        el percentil se toma directo. Para indicadores donde *mayor valor = menor riesgo*
 *        (ROA, ROE, reservas) se invierte (1 - percentil).
 */

'use client';

import { useEffect, useRef } from 'react';
import type { SfmData } from '~/data/schema';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HeatCell {
  dimension: string;
  indicador: string;
  mes: string;          // "YYYY-MM"
  valor: number;
  percentil: number;    // 0–100, normalizado rolling
  label: string;        // formatted value for tooltip
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Rank-based percentil empírico, igual que CISS del BCE */
function rollingPercentil(series: (number | null)[], invertir = false): number[] {
  return series.map((v, i) => {
    if (v === null) return 50; // null → centrar en zona neutra
    const window = series.slice(0, i + 1).filter((x): x is number => x !== null);
    const rank = window.filter((x) => x <= v).length;
    const pct = window.length <= 1 ? 50 : ((rank - 1) / (window.length - 1)) * 100;
    return invertir ? 100 - pct : pct;
  });
}

function formatPct(v: number) {
  return `${v.toFixed(2)}%`;
}
function formatMdd(v: number) {
  return `$${v.toLocaleString('es-MX', { maximumFractionDigits: 1 })} MDD`;
}

// ─── Data builder ────────────────────────────────────────────────────────────

function buildCells(data: SfmData): HeatCell[] {
  const cells: HeatCell[] = [];

  // ── 1. Crédito: IMOR, IMORA, ICOR (mensual CNBV)
  const { fechas, imor_total, imora_total, icor_total } =
    data.credito.historico_por_cartera;

  const lastN = Math.min(fechas.length, 24); // últimos 24 meses para el heatmap
  const startIdx = fechas.length - lastN;
  const fechasSlice = fechas.slice(startIdx);

  const imorPct = rollingPercentil(imor_total);
  const imoraPct = rollingPercentil(imora_total);
  const icorPct = rollingPercentil(icor_total);
  const roaPct = rollingPercentil(
    data.credito.historico_por_cartera.roa,
    true, // invertir: más ROA = menos riesgo
  );
  const roePct = rollingPercentil(
    data.credito.historico_por_cartera.roe,
    true,
  );

  for (let i = 0; i < lastN; i++) {
    const idx = startIdx + i;
    const mes = fechasSlice[i]!;

    if (imor_total[idx] !== undefined) {
      cells.push({ dimension: 'Crédito', indicador: 'IMOR', mes, valor: imor_total[idx]!, percentil: imorPct[idx]!, label: formatPct(imor_total[idx]!) });
    }
    if (imora_total[idx] !== undefined) {
      cells.push({ dimension: 'Crédito', indicador: 'IMORA', mes, valor: imora_total[idx]!, percentil: imoraPct[idx]!, label: formatPct(imora_total[idx]!) });
    }
    if (icor_total[idx] !== undefined) {
      cells.push({ dimension: 'Solvencia', indicador: 'ICOR', mes, valor: icor_total[idx]!, percentil: icorPct[idx]!, label: `${icor_total[idx]!.toFixed(4)}x` });
    }
    if (data.credito.historico_por_cartera.roa[idx] !== undefined) {
      cells.push({ dimension: 'Rentabilidad', indicador: 'ROA', mes, valor: data.credito.historico_por_cartera.roa[idx]!, percentil: roaPct[idx]!, label: formatPct(data.credito.historico_por_cartera.roa[idx]!) });
    }
    if (data.credito.historico_por_cartera.roe[idx] !== undefined) {
      cells.push({ dimension: 'Rentabilidad', indicador: 'ROE', mes, valor: data.credito.historico_por_cartera.roe[idx]!, percentil: roePct[idx]!, label: formatPct(data.credito.historico_por_cartera.roe[idx]!) });
    }
  }

  // ── 2. Mercado: FX (mensual), Tasa Banxico, Inflación
  const fxSeries = data.tipo_cambio.historico_mensual;
  const fxVals = fxSeries.map((p) => p.valor);
  const fxPct = rollingPercentil(fxVals); // más caro MXN = más riesgo

  const lastFx = Math.min(fxSeries.length, 24);
  const fxStart = fxSeries.length - lastFx;
  for (let i = 0; i < lastFx; i++) {
    const p = fxSeries[fxStart + i]!;
    const mes = p.mes;
    cells.push({
      dimension: 'Mercado',
      indicador: 'FX MXN/USD',
      mes,
      valor: p.valor,
      percentil: fxPct[fxStart + i]!,
      label: `$${p.valor.toFixed(4)}`,
    });
  }

  const tasaSeries = data.tasa_banxico.historico;
  const tasaVals = tasaSeries.map((p) => p.valor);
  const tasaPct = rollingPercentil(tasaVals); // tasa alta = restricción monetaria = riesgo relativo
  const lastTasa = Math.min(tasaSeries.length, 24);
  const tasaStart = tasaSeries.length - lastTasa;
  for (let i = 0; i < lastTasa; i++) {
    const p = tasaSeries[tasaStart + i]!;
    // RatePoint fecha can be DD/MM/YYYY or YYYY-MM-DD
    const tasaFecha = String(p.fecha ?? '');
    const mes = tasaFecha.includes('/')
      ? `${tasaFecha.slice(6, 10)}-${tasaFecha.slice(3, 5)}`
      : tasaFecha.slice(0, 7);
    cells.push({
      dimension: 'Macro',
      indicador: 'Tasa Banxico',
      mes,
      valor: p.valor,
      percentil: tasaPct[tasaStart + i]!,
      label: formatPct(p.valor),
    });
  }

  const infSeries = data.inflacion.historico_mensual;
  const infVals = infSeries.map((p) => p.valor);
  const infPct = rollingPercentil(infVals);
  const lastInf = Math.min(infSeries.length, 24);
  const infStart = infSeries.length - lastInf;
  for (let i = 0; i < lastInf; i++) {
    const p = infSeries[infStart + i]!;
    const mes: string = p.fecha ? p.fecha.slice(0, 7) : (p.mes ?? '');
    cells.push({
      dimension: 'Macro',
      indicador: 'Inflación',
      mes,
      valor: p.valor,
      percentil: infPct[infStart + i]!,
      label: formatPct(p.valor),
    });
  }

  // ── 3. Reservas Internacionales (liquidez externa)
  const resSeries = data.mercado?.reservas_internacionales?.historico ?? [];
  if (resSeries.length > 0) {
    const resVals = resSeries.map((p) => p.valor);
    const resPct = rollingPercentil(resVals, true); // más reservas = menos riesgo

    // Agrupar por mes (son datos semanales)
    const resByMes = new Map<string, { valor: number; percentil: number }>();
    resSeries.forEach((p, i) => {
      const mes = p.fecha.slice(0, 7);
      // Tomar el último dato del mes (end-of-month) — datos semanales en orden ascendente
      resByMes.set(mes, { valor: p.valor, percentil: resPct[i]! });
    });

    const resMonths = Array.from(resByMes.entries()).slice(-24);
    for (const [mes, { valor, percentil }] of resMonths) {
      cells.push({
        dimension: 'Liquidez',
        indicador: 'Reservas',
        mes,
        valor,
        percentil,
        label: formatMdd(valor),
      });
    }
  }

  return cells;
}

// ─── ECharts config builder ─────────────────────────────────────────────────

function buildEChartsOption(cells: HeatCell[]) {
  // Collect unique months and indicators, sorted
  const mesesSet = new Set(cells.map((c) => c.mes));
  const meses = Array.from(mesesSet).sort();

  // Order indicators by dimension
  const dimOrder = ['Crédito', 'Rentabilidad', 'Solvencia', 'Macro', 'Liquidez'];
  const indicadorsByDim = new Map<string, Set<string>>();
  for (const c of cells) {
    if (!indicadorsByDim.has(c.dimension)) indicadorsByDim.set(c.dimension, new Set());
    indicadorsByDim.get(c.dimension)!.add(c.indicador);
  }

  const indicadores: string[] = [];
  for (const dim of dimOrder) {
    const inds = indicadorsByDim.get(dim);
    if (inds) indicadores.push(...Array.from(inds));
  }

  // Build data matrix [mesIdx, indIdx, percentil, label, valor, dim]
  const dataMatrix: [number, number, number, string, number, string][] = [];
  for (const c of cells) {
    const xi = meses.indexOf(c.mes);
    const yi = indicadores.indexOf(c.indicador);
    if (xi >= 0 && yi >= 0) {
      dataMatrix.push([xi, yi, c.percentil, c.label, c.valor, c.dimension]);
    }
  }

  // Cell color mapped via piecewise visualMap: verde ≤ 33, amarillo 34–66, rojo ≥ 67

  // Format month label: YYYY-MM → oct'24
  const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const formatMesLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const mIdx = parseInt(m ?? '1', 10) - 1;
    return `${MONTHS_ES[mIdx] ?? m}'${(y ?? '').slice(2)}`;
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: unknown[] }) => {
        const d = params.data as [number, number, number, string, number, string];
        const [xi, yi, pct, label, , dim] = d;
        const mes = meses[xi] ?? '';
        const ind = indicadores[yi] ?? '';
        const pctRound = Math.round(pct);
        const semaforo =
          pctRound < 33 ? '🟢 Bajo' : pctRound < 66 ? '🟡 Moderado' : '🔴 Elevado';
        return `<div style="font-family:monospace;font-size:12px;line-height:1.6">
          <b>${ind}</b> · ${dim}<br/>
          Periodo: ${mes}<br/>
          Valor: <b>${label}</b><br/>
          Percentil: <b>${pctRound}°</b> (${semaforo})
        </div>`;
      },
    },
    grid: {
      top: 20,
      bottom: 80,
      left: 90,
      right: 20,
    },
    xAxis: {
      type: 'category',
      data: meses.map(formatMesLabel),
      axisLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.45)',
        rotate: 45,
        interval: Math.floor(meses.length / 12),
      },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    yAxis: {
      type: 'category',
      data: indicadores,
      axisLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 500,
      },
      splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    },
    visualMap: {
      type: 'piecewise',
      dimension: 2,
      pieces: [
        { min: 0,  max: 33,  color: '#22c55e', label: 'Bajo  (p < 33)' },
        { min: 33, max: 66,  color: '#fbbf24', label: 'Moderado' },
        { min: 66, max: 100, color: '#ef4444', label: 'Elevado  (p > 66)' },
      ],
      orient: 'horizontal',
      left: 'center',
      bottom: 8,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
    },
    series: [
      {
        name: 'Riesgo Sistémico',
        type: 'heatmap',
        data: dataMatrix,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        itemStyle: {
          borderRadius: 2,
          borderColor: 'rgba(0,0,0,0.3)',
          borderWidth: 0.5,
        },
      },
    ],
  };
}

// ─── React component ─────────────────────────────────────────────────────────

interface Props {
  data: SfmData;
}

export function RiskHeatmap({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<import('echarts').ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    (async () => {
      const echarts = await import('echarts');
      if (cancelled || !containerRef.current) return;

      const chart = echarts.init(containerRef.current, null, { renderer: 'canvas' });
      chartRef.current = chart;

      const cells = buildCells(data);
      if (cells.length === 0) {
        chart.setOption({
          graphic: [{
            type: 'text',
            left: 'center',
            top: 'middle',
            style: { text: 'Sin datos suficientes para el heatmap', fill: 'rgba(255,255,255,0.3)', fontSize: 13 },
          }],
        });
        return;
      }

      const option = buildEChartsOption(cells);
      chart.setOption(option);

      const ro = new ResizeObserver(() => chart.resize());
      ro.observe(containerRef.current!);

      return () => {
        ro.disconnect();
        chart.dispose();
      };
    })();

    return () => {
      cancelled = true;
      chartRef.current?.dispose();
    };
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '380px' }} />
  );
}
