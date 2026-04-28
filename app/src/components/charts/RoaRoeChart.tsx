import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin,
);

interface Props {
  fechas: string[];              // 'YYYY-MM'
  roa: (number | null)[];        // %
  roe: (number | null)[];        // %
}

const DEFAULT_CRISES = [
  { start: '1994-12', end: '1995-12', label: 'Tequila' },
  { start: '2008-09', end: '2009-06', label: 'GFC' },
  { start: '2020-03', end: '2020-06', label: 'COVID' },
] as const;

export function RoaRoeChart({ fechas, roa, roe }: Props) {
  const labels = fechas.map((f) => `${f}-01`);

  const data = {
    labels,
    datasets: [
      {
        label: 'ROA',
        data: roa,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'ROE',
        data: roe,
        borderColor: '#c4a35a',
        backgroundColor: 'rgba(196, 163, 90, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="ROA/ROE">
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
                    return y == null ? '—' : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: Object.fromEntries(
                  DEFAULT_CRISES.map((c, i) => [
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
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                position: 'left',
                ticks: { color: '#3fb950', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: {
                  display: true,
                  text: 'ROA',
                  color: '#3fb950',
                  font: { size: 10 },
                },
              },
              y1: {
                position: 'right',
                ticks: { color: '#c4a35a', callback: (v) => `${v}%` },
                grid: { drawOnChartArea: false },
                title: {
                  display: true,
                  text: 'ROE',
                  color: '#c4a35a',
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
