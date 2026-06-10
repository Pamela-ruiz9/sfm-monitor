import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';

interface SegmentoSeries {
  etapa2_pct: (number | null)[];
  etapa3_pct: (number | null)[];
}

interface BancoSeries {
  id: string;
  nombre: string;
  etapa1_pct: (number | null)[];
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
  porBanco?: BancoSeries[];
}

type VistaSegmento = 'sistema' | 'comercial' | 'consumo' | 'vivienda';

const SEG_PILLS: { id: VistaSegmento; label: string }[] = [
  { id: 'sistema',   label: 'Sistema' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'consumo',   label: 'Consumo' },
  { id: 'vivienda',  label: 'Vivienda' },
];

function pillClass(active: boolean) {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-(--color-gold-soft) text-(--color-gold) border-(--color-gold)/40'
      : 'text-(--color-text-mute) border-(--color-border) hover:text-(--color-text-dim) hover:border-(--color-border-soft)',
  );
}

export function Ifrs9Chart({ fechas, etapa1, etapa2, etapa3, porSegmento, porBanco }: Props) {
  const [vistaSegmento, setVistaSegmento] = useState<VistaSegmento>('sistema');
  const [bancoId, setBancoId] = useState<string>('sistema');

  const labels = fechas.map((f) => `${f}-01`);
  const hasSeg  = Boolean(porSegmento);
  const hasBancos = Boolean(porBanco?.length);

  const bancoSeleccionado = bancoId !== 'sistema'
    ? (porBanco ?? []).find((b) => b.id === bancoId)
    : null;

  // datos activos
  const activeE1 = bancoSeleccionado ? bancoSeleccionado.etapa1_pct : etapa1;
  const activeE2 = bancoSeleccionado ? bancoSeleccionado.etapa2_pct : etapa2;
  const activeE3 = bancoSeleccionado ? bancoSeleccionado.etapa3_pct : etapa3;

  let datasets;
  let yStacked = true;
  let yMax = 100;

  if (vistaSegmento === 'sistema' || !porSegmento || bancoSeleccionado) {
    // Vista sistema o banco individual — stacked area E1/E2/E3
    datasets = [
      {
        label: 'Stage 3',
        data: activeE3,
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 1, spanGaps: true,
      },
      {
        label: 'Stage 2',
        data: activeE2,
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 2, spanGaps: true,
      },
      {
        label: 'Stage 1',
        data: activeE1,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 3, spanGaps: true,
      },
    ];
  } else {
    // Vista por segmento — E1/E2/E3 apilado igual que sistema
    const seg = porSegmento[vistaSegmento];
    yStacked = true;
    yMax = 100;
    datasets = [
      {
        label: 'Stage 3',
        data: labels.map((_, i) => seg.etapa3_pct[i] ?? null),
        borderColor: '#f85149',
        backgroundColor: 'rgba(248, 81, 73, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 1, spanGaps: true,
      },
      {
        label: 'Stage 2',
        data: labels.map((_, i) => seg.etapa2_pct[i] ?? null),
        borderColor: '#d29922',
        backgroundColor: 'rgba(210, 153, 34, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 2, spanGaps: true,
      },
      {
        label: 'Stage 1',
        data: labels.map((_, i) => {
          const e2 = seg.etapa2_pct[i] ?? null;
          const e3 = seg.etapa3_pct[i] ?? null;
          return e2 != null && e3 != null ? Math.max(0, 100 - e2 - e3) : null;
        }),
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.5)',
        fill: true, tension: 0.1, pointRadius: 0, pointHoverRadius: 4, borderWidth: 1.5, order: 3, spanGaps: true,
      },
    ];
  }

  return (
    <ChartErrorBoundary chartName="IFRS 9 Stages">
      <div className="flex flex-wrap gap-3 mb-3 items-center">
        {/* Selector de banco */}
        {hasBancos && (
          <select
            value={bancoId}
            onChange={(e) => { setBancoId(e.target.value); setVistaSegmento('sistema'); }}
            className="text-xs px-2 py-1 rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-dim) focus:outline-none focus:border-(--color-gold)/60"
          >
            <option value="sistema">Sistema</option>
            {(porBanco ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        )}

        {/* Pills de segmento — solo en vista sistema */}
        {hasSeg && !bancoSeleccionado && (
          <div className="flex gap-1.5 flex-wrap">
            {SEG_PILLS.map((p) => (
              <button key={p.id} className={pillClass(vistaSegmento === p.id)} onClick={() => setVistaSegmento(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-64 md:h-72 -mx-1">
        <Line
          key={`${bancoId}-${vistaSegmento}`}
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
                min: 0,
                suggestedMax: yMax,
                ticks: { color: '#94a3b8', callback: (v) => `${Number(v).toFixed(1)}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
