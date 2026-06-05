import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';

interface BanxicoPoint {
  fecha: string; // 'YYYY-MM-DD'
  valor: number;
}

interface Props {
  fechas: string[];               // 'YYYY-MM'
  tasaActiva: (number | null)[];  // % rendimiento cartera
  tasaPasiva: (number | null)[];  // % costo fondeo
  mif: (number | null)[];         // % margen intermediación
  tasaBanxico?: BanxicoPoint[];   // historico de decisiones (step line)
}

// Okabe-Ito palette entries
const COLOR_ACTIVA  = '#E69F00';  // amber — rendimiento activo
const COLOR_PASIVA  = '#56B4E9';  // sky   — costo pasivo
const COLOR_MIF     = '#009E73';  // green — spread/margen
const COLOR_BANXICO = '#CC79A7';  // mauve — referencia política monetaria

export function MifChart({ fechas, tasaActiva, tasaPasiva, mif, tasaBanxico }: Props) {
  const toPoints = (arr: (number | null)[], dates: string[]) =>
    arr.map((y, i) => ({ x: dates[i]! + '-01', y }));

  const datasets = [
    {
      label: 'Tasa activa implícita',
      data: toPoints(tasaActiva, fechas),
      borderColor: COLOR_ACTIVA,
      backgroundColor: COLOR_ACTIVA + '22',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      spanGaps: true,
    },
    {
      label: 'Tasa pasiva implícita',
      data: toPoints(tasaPasiva, fechas),
      borderColor: COLOR_PASIVA,
      backgroundColor: COLOR_PASIVA + '22',
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      spanGaps: true,
    },
    {
      label: 'MIF',
      data: toPoints(mif, fechas),
      borderColor: COLOR_MIF,
      backgroundColor: COLOR_MIF + '22',
      borderWidth: 2,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      spanGaps: true,
    },
    ...(tasaBanxico
      ? [{
          label: 'Tasa Banxico',
          data: tasaBanxico.map((p) => ({ x: p.fecha, y: p.valor })),
          borderColor: COLOR_BANXICO,
          borderDash: [4, 4],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          stepped: true as const,
          spanGaps: true,
        }]
      : []),
  ];

  return (
    <ChartErrorBoundary chartName="MIF">
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={{ datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    if (y == null) return '—';
                    return `${ctx.dataset.label}: ${y.toFixed(2)}%`;
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
