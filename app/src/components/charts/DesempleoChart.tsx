import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface LaborPoint {
  fecha: string; // YYYY-MM
  valor: number;
}

interface Props {
  series: LaborPoint[];
  subocupacion?: LaborPoint[] | undefined;
}

const PRE_PANDEMIA_REF = 3.4;

export function DesempleoChart({ series, subocupacion }: Props) {
  const toPoints = (pts: LaborPoint[]) =>
    [...pts].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((p) => ({ x: `${p.fecha}-15`, y: p.valor }));

  const points    = toPoints(series);
  const ptsSub    = subocupacion?.length ? toPoints(subocupacion) : null;

  const data = {
    datasets: [
      {
        label: 'Desocupación',
        data: points,
        borderColor: '#E69F00',
        backgroundColor: 'rgba(230, 159, 0, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      ...(ptsSub ? [{
        label: 'Subocupación',
        data: ptsSub,
        borderColor: '#56B4E9',
        backgroundColor: 'rgba(86, 180, 233, 0.0)',
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 1.5,
        borderDash: [4, 3] as number[],
      }] : []),
    ],
  };

  return (
    <ChartErrorBoundary chartName="Desempleo ENOE">
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
                    return y == null ? '—' : `Desocupación: ${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: {
                  refLine: {
                    type: 'line',
                    yMin: PRE_PANDEMIA_REF,
                    yMax: PRE_PANDEMIA_REF,
                    borderColor: 'rgba(148, 163, 184, 0.4)',
                    borderWidth: 1,
                    borderDash: [4, 4],
                    label: {
                      display: true,
                      content: `Ref. pre-pandemia ${PRE_PANDEMIA_REF}%`,
                      position: 'end',
                      color: '#94a3b8',
                      font: { size: 10 },
                    },
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
                suggestedMin: 1,
                suggestedMax: 6,
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
