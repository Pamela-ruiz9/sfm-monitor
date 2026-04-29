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
  total: number[];
  comercial: number[];
  consumo: number[];
  vivienda: number[];
}

export function SofiposSegmentChart({ fechas, total, comercial, consumo, vivienda }: Props) {
  const labels = fechas.map((f) => `${f}-15`);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total',
        data: total,
        borderColor: '#c4a35a',
        backgroundColor: 'rgba(196, 163, 90, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
      {
        label: 'Comercial',
        data: comercial,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
      {
        label: 'Consumo',
        data: consumo,
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
      {
        label: 'Vivienda',
        data: vivienda,
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMOR por cartera">
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
                min: 0,
                max: 45,
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
