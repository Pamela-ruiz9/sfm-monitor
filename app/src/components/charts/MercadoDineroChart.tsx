import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface RatePoint {
  fecha: string;
  valor: number;
}

interface Props {
  tiie: RatePoint[];
  cetes: RatePoint[];
  banxico: RatePoint[];
}

/**
 * Superpone TIIE Fondeo, Cetes 28d y Tasa Banxico en una sola gráfica.
 * Permite ver la transmisión de política monetaria y el spread interbancario.
 */
export function MercadoDineroChart({ tiie, cetes, banxico }: Props) {
  // TIIE es diaria (20 puntos ~1 mes), Cetes/Banxico son semanales/decisiones
  // Normalizamos todas las fechas a ISO YYYY-MM-DD
  const normalize = (pts: RatePoint[]) =>
    pts
      .map((p) => ({ x: p.fecha.slice(0, 10), y: p.valor }))
      .sort((a, b) => a.x.localeCompare(b.x));

  const tiiePoints = normalize(tiie);
  const cetesPoints = normalize(cetes);

  // Banxico: stepped — mantiene valor hasta próxima decisión
  const banxicoPoints = normalize(banxico);

  const data = {
    datasets: [
      {
        label: 'TIIE 28d (diaria)',
        data: tiiePoints,
        borderColor: '#E69F00',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Cetes 28d (semanal)',
        data: cetesPoints,
        borderColor: '#56B4E9',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 1,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Tasa Banxico (objetivo)',
        data: banxicoPoints,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        stepped: 'before' as const,
        fill: false,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Mercado de Dinero">
      <div className="h-72 md:h-80 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                labels: {
                  color: '#94a3b8',
                  boxWidth: 12,
                  font: { size: 11 },
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null ? `${ctx.dataset.label}: —` : `${ctx.dataset.label}: ${y.toFixed(4)}%`;
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
                  callback: (v) => `${Number(v).toFixed(1)}%`,
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
