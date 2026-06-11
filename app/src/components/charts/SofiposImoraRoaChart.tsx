import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface Props {
  fechas: string[];
  imor: (number | null)[];
  roa: (number | null)[];
  roe?: (number | null)[];
}

export function SofiposImoraRoaChart({ fechas, imor, roa, roe }: Props) {
  const labels = fechas.map((f) => `${f}-15`);

  const datasets = [
    {
      label: 'IMOR Total',
      data: imor,
      borderColor: '#d29922',
      backgroundColor: 'rgba(210, 153, 34, 0.08)',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: 'y' as const,
      spanGaps: true,
    },
    {
      label: 'ROA',
      data: roa,
      borderColor: '#f85149',
      backgroundColor: 'rgba(248, 81, 73, 0.08)',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: 'y1' as const,
      spanGaps: true,
    },
    ...(roe
      ? [
          {
            label: 'ROE',
            data: roe,
            borderColor: '#79c0ff',
            backgroundColor: 'rgba(121, 192, 255, 0.08)',
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
            borderDash: [4, 3],
            yAxisID: 'y1' as const,
            spanGaps: true,
          },
        ]
      : []),
  ];

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMOR + ROA/ROE">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                labels: { color: '#94a3b8', boxWidth: 12, font: { size: 11 } },
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
                position: 'left',
                min: 0,
                ticks: { color: '#d29922', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: { display: true, text: 'IMOR (%)', color: '#d29922', font: { size: 10 } },
              },
              y1: {
                position: 'right',
                ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'ROA / ROE (%)', color: '#94a3b8', font: { size: 10 } },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
