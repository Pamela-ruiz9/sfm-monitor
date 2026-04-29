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
  fechas: string[];    // 'YYYY-MM' from 2022-01
  etapa1: number[];
  etapa2: number[];
  etapa3: number[];
}

export function Ifrs9Chart({ fechas, etapa1, etapa2, etapa3 }: Props) {
  const labels = fechas.map((f) => `${f}-01`);

  const data = {
    labels,
    datasets: [
      {
        label: 'Etapa 3',
        data: etapa3,
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.5)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        order: 1,
      },
      {
        label: 'Etapa 2',
        data: etapa2,
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.5)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        order: 2,
      },
      {
        label: 'Etapa 1',
        data: etapa1,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.5)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        order: 3,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="IFRS 9 Etapas">
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
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                stacked: true,
                min: 0,
                max: 100,
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
