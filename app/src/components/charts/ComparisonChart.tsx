import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

interface Props {
  fechasBm: string[];
  valuesBm: (number | null)[];
  fechasSf: string[];
  valuesSf: (number | null)[];
  labelBm?: string;
  labelSf?: string;
  /** Si true, el eje Y puede ir por debajo de 0 (e.g. ROA) */
  allowNegative?: boolean;
  tooltipSuffix?: string;
  yTickSuffix?: string;
}

export function ComparisonChart({
  fechasBm,
  valuesBm,
  fechasSf,
  valuesSf,
  labelBm = 'Banca Múltiple',
  labelSf = 'SoFiPOs',
  allowNegative = false,
  tooltipSuffix = '%',
  yTickSuffix = '%',
}: Props) {
  const chartData = {
    datasets: [
      {
        label: labelBm,
        data: fechasBm.map((f, i) => ({ x: `${f}-15`, y: valuesBm[i] ?? null })),
        borderColor: '#c4a35a',
        backgroundColor: 'rgba(196, 163, 90, 0.06)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
      {
        label: labelSf,
        data: fechasSf.map((f, i) => ({ x: `${f}-15`, y: valuesSf[i] ?? null })),
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.06)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Comparativa">
      <div className="h-52 md:h-60 -mx-1">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
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
                    return y == null
                      ? `${ctx.dataset.label}: —`
                      : `${ctx.dataset.label}: ${y.toFixed(2)}${tooltipSuffix}`;
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
                ...(allowNegative ? {} : { min: 0 }),
                ticks: {
                  color: '#94a3b8',
                  callback: (v) => `${v}${yTickSuffix}`,
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
