import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface IgaePoint {
  fecha: string; // YYYY-MM
  valor: number; // var. anual %
}

interface Props {
  series: IgaePoint[];
}

export function IgaeChart({ series }: Props) {
  const points = [...series]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((p) => ({ x: `${p.fecha}-15`, y: p.valor }));

  const data = {
    datasets: [
      {
        label: 'IGAE var. anual',
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

  const earliestDate = points.length > 0 ? points[0]!.x.slice(0, 7) : null;

  return (
    <ChartErrorBoundary chartName="IGAE">
      {earliestDate && earliestDate >= '2025-12' && (
        <p className="text-[10px] text-[--color-text-mute] mb-1 text-right">
          Serie BIE disponible desde dic 2025 (migración INEGI)
        </p>
      )}
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
                    return y == null ? '—' : `IGAE: ${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: {
                  zeroLine: {
                    type: 'line',
                    yMin: 0,
                    yMax: 0,
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    borderWidth: 1,
                    borderDash: [4, 4],
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
