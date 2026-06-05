import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface Props {
  fechas: string[];                // 'YYYY-MM'
  eprcCartera: (number | null)[];  // % — EPRC / cartera total
}

// Okabe-Ito: sky blue — cobertura/reservas
const COLOR = '#56B4E9';

export function EprcChart({ fechas, eprcCartera }: Props) {
  const labels = fechas.map((f) => `${f}-01`);
  const nonNull = eprcCartera.filter((v): v is number => v !== null);
  const yMax = nonNull.length > 0 ? Math.ceil(Math.max(...nonNull) * 1.2) : 6;

  return (
    <ChartErrorBoundary chartName="EPRC / Cartera">
      <p className="text-[10px] text-[--color-text-mute] mb-2">
        EPRC (reservas preventivas) como % de la cartera total. Complementa el ICOR: mientras ICOR = EPRC / vencida, esta métrica muestra la carga de reservas sobre el portafolio completo.
      </p>
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: 'EPRC / Cartera total',
                data: eprcCartera,
                borderColor: COLOR,
                backgroundColor: COLOR + '22',
                fill: true,
                tension: 0.2,
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
                    if (y == null) return '—';
                    return `EPRC / Cartera: ${y.toFixed(2)}%`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                grid: { color: 'rgba(148,163,184,0.08)' },
              },
              y: {
                min: 0,
                suggestedMax: yMax,
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `${Number(v).toFixed(1)}%`,
                },
                grid: { color: 'rgba(148,163,184,0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
