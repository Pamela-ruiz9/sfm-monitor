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

interface InflacionPoint {
  fecha: string;
  mes: string; // YYYY-MM
  var_anual: number;
}

interface Props {
  series: InflacionPoint[];
  /** Banxico target inflation (default 3.0%). */
  target?: number;
  /** Tolerance band around target (default ±1pp = 2-4%). */
  band?: number;
}

export function InflacionChart({
  series,
  target = 3.0,
  band = 1.0,
}: Props) {
  const points = series
    .slice()
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map((p) => ({ x: `${p.mes}-15`, y: p.var_anual }));

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
