import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

// Okabe-Ito CVD-safe palette (8 colors, cycled for up to 15 lines)
// Note: original first color #000000 replaced with #E6194B — black is invisible on dark backgrounds
const OKABE_ITO = [
  '#E6194B',
  '#E69F00',
  '#56B4E9',
  '#009E73',
  '#F0E442',
  '#0072B2',
  '#D55E00',
  '#CC79A7',
];

interface Entidad {
  nombre: string;
  imor: (number | null)[];
}

interface Props {
  fechas: string[];
  entidades: Entidad[]; // pre-filtered to top 15 by caller
}

export function SofiposEntidadesChart({ fechas, entidades }: Props) {
  const labels = fechas.map((f) => `${f}-15`);

  const data = {
    labels,
    datasets: entidades.map((e, i) => ({
      label: e.nombre,
      data: e.imor,
      borderColor: OKABE_ITO[i % OKABE_ITO.length],
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.5,
      spanGaps: true,
    })),
  };

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMOR por entidad">
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
                labels: { color: '#94a3b8', boxWidth: 10, font: { size: 9 } },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null
                      ? `${ctx.dataset.label}: —`
                      : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
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
