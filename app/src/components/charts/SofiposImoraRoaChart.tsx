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
);

interface Props {
  fechas: string[];
  imora: (number | null)[];
  roa: (number | null)[];
}

export function SofiposImoraRoaChart({ fechas, imora, roa }: Props) {
  const labels = fechas.map((f) => `${f}-15`);

  const data = {
    labels,
    datasets: [
      {
        label: 'IMORA Total',
        data: imora,
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y',
        spanGaps: true,
      },
      {
        label: 'ROA',
        data: roa,
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y1',
        spanGaps: true,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMORA + ROA">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null
                      ? `${ctx.dataset.label}: —`
                      : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
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
                position: 'left',
                ticks: { color: '#d29922', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: {
                  display: true,
                  text: 'IMORA',
                  color: '#d29922',
                  font: { size: 10 },
                },
              },
              y1: {
                position: 'right',
                suggestedMin: 0,
                ticks: { color: '#f85149', callback: (v) => `${v}%` },
                grid: { drawOnChartArea: false },
                title: {
                  display: true,
                  text: 'ROA',
                  color: '#f85149',
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
