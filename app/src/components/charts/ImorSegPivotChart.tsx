import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

type Cartera = 'total' | 'comercial' | 'consumo' | 'vivienda' | 'tarjeta' | 'consumo_norev';

interface Props {
  /** Solo banca múltiple — SoFiPOs tiene su propia página /sofipos */
  bm: {
    fechas: string[];
    cartera: {
      total: number[];
      comercial: number[];
      consumo: number[];
      vivienda: number[];
      tarjeta: number[];
      consumo_norev: number[];
    };
    bancos: Array<{ id: string; nombre: string; imor_total: (number | null)[] }>;
  };
  /** @deprecated — ignorado, SoFiPOs tiene su propia página */
  sofipos?: unknown;
}

const CARTERA_LABELS: Record<Cartera, string> = {
  total: 'Total',
  comercial: 'Comercial',
  consumo: 'Consumo',
  vivienda: 'Vivienda',
  tarjeta: 'Tarjeta',
  consumo_norev: 'Consumo no rev.',
};

const BM_CARTERAS: Cartera[] = ['total', 'comercial', 'consumo', 'vivienda', 'tarjeta', 'consumo_norev'];
const SOFI_CARTERAS: Cartera[] = ['total', 'comercial', 'consumo', 'vivienda'];

function pillClass(active: boolean): string {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-[--color-gold-soft] text-[--color-gold] border-[--color-gold]/40'
      : 'text-[--color-text-mute] border-[--color-border] hover:text-[--color-text-dim] hover:border-[--color-border-soft]',
  );
}

export function ImorSegPivotChart({ bm }: Props) {
  const [view, setView] = useState<'sistema' | 'banco'>('sistema');
  const [cartera, setCartera] = useState<Cartera>('total');
  const [bancoId, setBancoId] = useState<string>(bm.bancos[0]?.id ?? '');

  const { fechas, values, label, color } = useMemo(() => {
    if (view === 'sistema') {
      const v = bm.cartera[cartera] ?? bm.cartera.total;
      return {
        fechas: bm.fechas,
        values: v,
        label: `Banca Múltiple · ${CARTERA_LABELS[cartera]}`,
        color: '#c4a35a',
      };
    }
    const banco = bm.bancos.find((b) => b.id === bancoId) ?? bm.bancos[0];
    if (!banco) {
      return {
        fechas: bm.fechas,
        values: [] as (number | null)[],
        label: 'Datos por banco no disponibles en esta versión',
        color: '#c4a35a',
      };
    }
    return {
      fechas: bm.fechas,
      values: banco.imor_total,
      label: `Banca Múltiple · ${banco.nombre}`,
      color: '#c4a35a',
    };
  }, [view, cartera, bancoId, bm]);

  const latest = values[values.length - 1];
  const xMin = fechas.length > 0 ? `${fechas[0]}-15` : undefined;

  const chartData = {
    labels: fechas.map((f) => `${f}-15`),
    datasets: [
      {
        label,
        data: values as (number | null)[],
        borderColor: color,
        backgroundColor: color + '22',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  function changeView(next: 'sistema' | 'banco') {
    setView(next);
    if (next !== 'sistema') setCartera('total');
  }

  return (
    <ChartErrorBoundary chartName="IMOR pivotable">
      <div className="space-y-3">
        {/* View toggle */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => changeView('sistema')} className={pillClass(view === 'sistema')}>
            Sistema
          </button>
          <button
            onClick={() => changeView('banco')}
            className={pillClass(view === 'banco')}>
            Por banco
          </button>
        </div>

        {/* Sub-selector */}
        {view === 'sistema' && (
          <div className="flex gap-1.5 flex-wrap">
            {BM_CARTERAS.map((c) => (
              <button key={c} onClick={() => setCartera(c)} className={pillClass(cartera === c)}>
                {CARTERA_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        {view === 'banco' && bm.bancos.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {bm.bancos.map((b) => (
              <button key={b.id} onClick={() => setBancoId(b.id)} className={pillClass(bancoId === b.id)}>
                {b.nombre}
              </button>
            ))}
          </div>
        )}
        {view === 'banco' && bm.bancos.length === 0 && (
          <p className="text-xs text-[--color-text-mute] italic">Datos por banco no disponibles en esta versión.</p>
        )}

        {/* Current value display */}
        <div className="flex items-baseline justify-between border-t border-[--color-border-soft] pt-3">
          <div className="text-[10px] text-[--color-text-mute] uppercase tracking-wider">{label}</div>
          <div className="serif tabular text-2xl font-semibold" style={{ color }}>
            {latest != null ? `${(latest as number).toFixed(2)}%` : '—'}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 md:h-72 -mx-1">
          <Line
            data={chartData}
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
                      return y == null ? '—' : `${y.toFixed(2)}%`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  type: 'time',
                  time: { unit: 'year' },
                  min: xMin,
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
      </div>
    </ChartErrorBoundary>
  );
}
