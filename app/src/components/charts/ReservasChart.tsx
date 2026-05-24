import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface ReservaPoint {
  fecha: string;
  valor: number;
}

interface Props {
  series: ReservaPoint[];
}

/**
 * Evolución semanal de Reservas Internacionales (últimas 52 semanas).
 * Valores en millones de USD.
 */
export function ReservasChart({ series }: Props) {
  const points = [...series]
    .map((p) => ({ x: p.fecha.slice(0, 10), y: p.valor }))
    .sort((a, b) => a.x.localeCompare(b.x));

  const data = {
    datasets: [
      {
        label: 'Reservas internacionales (MDD)',
        data: points,
        borderColor: '#009E73',
        backgroundColor: 'rgba(0, 158, 115, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Reservas Internacionales">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    if (y == null) return '—';
                    return `Reservas: ${(y / 1000).toFixed(1)}B USD`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'month' },
                ticks: { color: '#94a3b8', maxTicksLimit: 12 },
                grid: { color: 'rgba(148, 163, 184, 0.08)' },
              },
              y: {
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `${(Number(v) / 1000).toFixed(0)}B`,
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
