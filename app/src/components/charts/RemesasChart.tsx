import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface DataPoint {
  fecha: string;
  valor: number;
}

interface Props {
  series: DataPoint[];
}

export function RemesasChart({ series }: Props) {
  const labels = series.map((p) => `${p.fecha}-15`);
  const values = series.map((p) => p.valor);

  return (
    <ChartErrorBoundary chartName="Remesas familiares">
      <div className="h-52 md:h-64 -mx-1">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'Remesas (MUSD)',
                data: values,
                borderColor: '#56d364',
                backgroundColor: 'rgba(86, 211, 100, 0.08)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 4,
                borderWidth: 2,
                spanGaps: true,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null ? 'Remesas: —' : `Remesas: $${y.toFixed(0)} MUSD`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
                ticks: { color: '#94a3b8', maxTicksLimit: 8 },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
              y: {
                ticks: { color: '#94a3b8', callback: (v) => `$${v}` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: { display: true, text: 'MUSD', color: '#94a3b8', font: { size: 10 } },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
