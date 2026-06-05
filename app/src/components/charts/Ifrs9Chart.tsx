import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';

interface SegmentoSeries {
  etapa2_pct: (number | null)[];
  etapa3_pct: (number | null)[];
}

interface Props {
  fechas: string[];
  etapa1: number[];
  etapa2: number[];
  etapa3: number[];
  porSegmento?: {
    comercial: SegmentoSeries;
    consumo:   SegmentoSeries;
    vivienda:  SegmentoSeries;
  };
}

type Vista = 'sistema' | 'comercial' | 'consumo' | 'vivienda';

const PILLS: { id: Vista; label: string }[] = [
  { id: 'sistema',   label: 'Sistema' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'consumo',   label: 'Consumo' },
  { id: 'vivienda',  label: 'Vivienda' },
];

function pillClass(active: boolean) {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-[--color-gold-soft] text-[--color-gold] border-[--color-gold]/40'
      : 'text-[--color-text-mute] border-[--color-border] hover:text-[--color-text-dim] hover:border-[--color-border-soft]',
  );
}

export function Ifrs9Chart({ fechas, etapa1, etapa2, etapa3, porSegmento }: Props) {
  const [vista, setVista] = useState<Vista>('sistema');

  const labels = fechas.map((f) => `${f}-01`);
  const hasSeg = Boolean(porSegmento);

  let datasets;
  let yStacked = true;
  let yMin = 0;
  let yMax = 100;
  let yLabel = (v: number | string) => `${v}%`;

  if (vista === 'sistema' || !porSegmento) {
    datasets = [
      {
        label: 'Stage 3',
        data: etapa3,
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 1,
      },
      {
        label: 'Stage 2',
        data: etapa2,
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 2,
      },
      {
        label: 'Stage 1',
        data: etapa1,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 3,
      },
    ];
  } else {
    // Vista por segmento: muestra % en E2 y E3 de esa cartera (no apilado)
    const seg = porSegmento[vista];
    yStacked = false;
    yMin = 0;
    yMax = 15;
    datasets = [
      {
        label: 'Stage 3',
        data: labels.map((_, i) => seg.etapa3_pct[i] ?? null),
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.15)',
        fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, order: 1,
        spanGaps: true,
      },
      {
        label: 'Stage 2',
        data: labels.map((_, i) => seg.etapa2_pct[i] ?? null),
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.15)',
        fill: true, tension: 0.2, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, order: 2,
        spanGaps: true,
      },
    ];
    yLabel = (v) => `${Number(v).toFixed(1)}%`;
  }

  return (
    <ChartErrorBoundary chartName="IFRS 9 Stages">
      {hasSeg && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {PILLS.map((p) => (
            <button key={p.id} className={pillClass(vista === p.id)} onClick={() => setVista(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
      {vista !== 'sistema' && (
        <p className="text-[10px] text-[--color-text-mute] mb-2">
          % de la cartera {vista} en cada Stage (Stage 1 = 100% − E2 − E3)
        </p>
      )}
      <div className="h-64 md:h-72 -mx-1">
        <Line
          key={vista}
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { labels: { color: '#e2e8f0', font: { size: 11 }, boxWidth: 12 } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null ? '—' : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
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
                stacked: yStacked,
                min: yMin,
                suggestedMax: yMax,
                ticks: { color: '#94a3b8', callback: yLabel },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
