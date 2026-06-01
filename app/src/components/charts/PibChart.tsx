import { Bar } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface PibPoint {
  fecha: string; // YYYY-QN
  valor: number; // var. anual %
}

interface Props {
  series: PibPoint[];
}

function quarterToLabel(fecha: string): string {
  // '2025-Q4' → 'Q4-25'
  const [year, q] = fecha.split('-');
  return `${q}-${(year ?? '').slice(2)}`;
}

export function PibChart({ series }: Props) {
  const sorted = [...series].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const labels = sorted.map((p) => quarterToLabel(p.fecha));
  const values = sorted.map((p) => p.valor);

  const barColors = values.map((v) =>
    v >= 0 ? 'rgba(0, 158, 115, 0.75)' : 'rgba(239, 68, 68, 0.75)',
  );
  const borderColors = values.map((v) =>
    v >= 0 ? 'rgba(0, 158, 115, 1)' : 'rgba(239, 68, 68, 1)',
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'PIB var. anual',
        data: values,
        backgroundColor: barColors,
        borderColor: borderColors,
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="PIB trimestral">
      <div className="h-64 md:h-72 -mx-1">
        <Bar
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
                    return y == null ? '—' : `PIB: ${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: {
                  zeroLine: {
                    type: 'line',
                    yMin: 0,
                    yMax: 0,
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                    borderWidth: 1,
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: { color: '#94a3b8', maxRotation: 0 },
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
