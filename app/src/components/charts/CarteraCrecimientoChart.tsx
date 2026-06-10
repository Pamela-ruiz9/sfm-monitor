import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface Props {
  fechas: string[];       // YYYY-MM
  yoy: (number | null)[]; // variación % anual
  mmp: (number | null)[]; // saldo MMP (para tooltip)
}

export function CarteraCrecimientoChart({ fechas, yoy, mmp }: Props) {
  const points = fechas.map((f, i) => ({ x: `${f}-15`, y: yoy[i] ?? null }));

  const data = {
    datasets: [
      {
        label: 'Crecimiento anual cartera',
        data: points,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: false,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Crecimiento de cartera">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (items) => items[0]?.label?.slice(0, 7) ?? '',
                  label: (ctx) => {
                    const i = ctx.dataIndex;
                    const g = ctx.parsed.y;
                    const s = mmp[i];
                    const lines = [];
                    if (g != null) lines.push(`Crecimiento: ${g >= 0 ? '+' : ''}${g.toFixed(2)}%`);
                    if (s != null) lines.push(`Saldo: ${s.toFixed(0)} MMP`);
                    return lines;
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
                    borderDash: [3, 3],
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ticks: { color: '#94a3b8', maxTicksLimit: 10 },
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
