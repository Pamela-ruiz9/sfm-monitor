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
  fechas: string[];  // 'YYYY-MM'
  values: number[];  // ratio (e.g. 1.49)
}

const DEFAULT_CRISES = [
  { start: '1994-12', end: '1995-12', label: 'Tequila' },
  { start: '2008-09', end: '2009-06', label: 'GFC' },
  { start: '2020-03', end: '2020-06', label: 'COVID' },
] as const;

export function IcorChart({ fechas, values }: Props) {
  const maxVal = Math.max(...values);
  const yMax = Math.ceil(maxVal * 1.2 * 10) / 10;

  const data = {
    labels: fechas.map((f) => `${f}-01`),
    datasets: [
      {
        label: 'ICOR Total',
        data: values,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="ICOR">
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
                    return y == null ? '—' : `${y.toFixed(2)}× cobertura`;
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
                min: 0,
                max: yMax,
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `${Number(v).toFixed(1)}x`,
                },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
