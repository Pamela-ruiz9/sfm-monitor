import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

type RangeValue = '1y' | '3y' | '5y' | 'all';

const RANGES: ReadonlyArray<{ label: string; value: RangeValue }> = [
  { label: '1A', value: '1y' },
  { label: '3A', value: '3y' },
  { label: '5A', value: '5y' },
  { label: 'Máx', value: 'all' },
];

interface InflacionPoint {
  fecha: string;
  mes: string; // YYYY-MM
  valor: number;
}

interface Props {
  series: InflacionPoint[];
  /** Banxico target inflation (default 3.0%). */
  target?: number;
  /** Tolerance band around target (default ±1pp = 2-4%). */
  band?: number;
}

function filterInflacionByRange(
  series: InflacionPoint[],
  range: RangeValue,
): InflacionPoint[] {
  if (range === 'all' || series.length === 0) return series;
  const sorted = series.slice().sort((a, b) => a.mes.localeCompare(b.mes));
  const last = sorted[sorted.length - 1]!;
  const lastDate = new Date(`${last.mes}-15`);
  const years = range === '1y' ? 1 : range === '3y' ? 3 : 5;
  const cutoff = new Date(lastDate);
  cutoff.setFullYear(cutoff.getFullYear() - years);
  return sorted.filter((p) => new Date(`${p.mes}-15`) >= cutoff);
}

export function InflacionChart({
  series,
  target = 3.0,
  band = 1.0,
}: Props) {
  const [range, setRange] = useState<RangeValue>('all');

  const filtered = filterInflacionByRange(series, range);
  const points = filtered
    .slice()
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((p) => ({ x: `${p.mes}-15`, y: p.valor }));
  const xMin = points.length > 0 ? points[0]!.x : undefined;

  const data = {
    datasets: [
      {
        label: 'Inflación anual (INPC)',
        data: points,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Inflación INPC">
      <div className="flex items-center justify-end gap-1 mb-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={{
              color: range === r.value ? 'var(--color-gold)' : 'var(--color-text-mute)',
              borderColor: range === r.value ? 'var(--color-gold)' : 'var(--color-border)',
            }}
            className="px-2 py-0.5 text-[10px] font-semibold border rounded transition-colors"
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: '#e2e8f0' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null ? '—' : `${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: {
                  targetBand: {
                    type: 'box',
                    yMin: target - band,
                    yMax: target + band,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    borderWidth: 1,
                    label: {
                      display: true,
                      content: `Objetivo Banxico ${target}% ±${band}pp`,
                      position: 'end',
                      color: '#10b981',
                      font: { size: 10 },
                    },
                  },
                  targetLine: {
                    type: 'line',
                    yMin: target,
                    yMax: target,
                    borderColor: 'rgba(16, 185, 129, 0.6)',
                    borderWidth: 1,
                    borderDash: [4, 4],
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ...(xMin ? { min: xMin } : {}),
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
