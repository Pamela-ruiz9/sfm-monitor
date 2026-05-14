import { Line } from 'react-chartjs-2';
import type { MonthlyPointT } from '~/data/schema';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

interface Props {
  series: MonthlyPointT[];
  /** Crisis events to annotate as vertical bands. */
  crises?: ReadonlyArray<{ start: string; end: string; label: string }>;
}

const DEFAULT_CRISES = [
  { start: '1994-12', end: '1995-12', label: 'Tequila' },
  { start: '2008-09', end: '2009-06', label: 'GFC' },
  { start: '2020-03', end: '2020-06', label: 'COVID' },
] as const;

export function FXChart({ series, crises = DEFAULT_CRISES }: Props) {
  const xMin = series.length > 0 ? `${series[0].mes}-01` : undefined;
  const data = {
    labels: series.map((p) => `${p.mes}-01`),
    datasets: [
      {
        label: 'MXN/USD (FIX, fin de mes)',
        data: series.map((p) => p.valor),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="MXN/USD FIX">
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
                    return y == null ? '—' : `$${y.toFixed(4)} MXN/USD`;
                  },
                },
              },
              annotation: {
                annotations: Object.fromEntries(
                  crises.map((c, i) => [
                    `crisis-${i}`,
                    {
                      type: 'box',
                      xMin: `${c.start}-01`,
                      xMax: `${c.end}-01`,
                      backgroundColor: 'rgba(148, 163, 184, 0.12)',
                      borderColor: 'rgba(148, 163, 184, 0.3)',
                      borderWidth: 1,
                      label: {
                        display: true,
                        content: c.label,
                        position: 'start',
                        color: '#94a3b8',
                        font: { size: 10 },
                      },
                    },
                  ]),
                ),
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
                ticks: { color: '#94a3b8', callback: (v) => `$${v}` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
