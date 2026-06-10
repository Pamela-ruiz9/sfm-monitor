import { Bar } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface Props {
  fechas: string[];                // 'YYYY-MM'
  valores: (number | null)[];      // mmdp — flujo acumulado 12 meses
}

// Okabe-Ito: vermillion para flujos de deterioro
const COLOR_BAR  = '#D55E00';
const COLOR_BAR_HOVER = '#E07050';

export function QuitasChart({ fechas, valores }: Props) {
  const labels = fechas.map((f) => `${f}-01`);

  return (
    <ChartErrorBoundary chartName="Quitas y castigos">
      <p className="text-[10px] text-(--color-text-mute) mb-2">
        Flujo acumulado 12 meses · miles de millones de pesos (mmdp)
      </p>
      <div className="h-64 md:h-72 -mx-1">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: 'Quitas y castigos',
                data: valores,
                backgroundColor: COLOR_BAR + 'cc',
                hoverBackgroundColor: COLOR_BAR_HOVER,
                borderWidth: 0,
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
                    return `Quitas y castigos: ${y.toFixed(1)} mmdp`;
                  },
                },
              },
            },
            scales: {
              x: {
                type: 'time',
                time: { unit: 'year' },
                ticks: { color: '#94a3b8', maxTicksLimit: 12 },
                grid: { display: false },
              },
              y: {
                min: 0,
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `${Number(v).toFixed(0)} mmdp`,
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
