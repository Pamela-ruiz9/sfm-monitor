import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
);

type Sector = 'bm' | 'sofipos';
type Cartera = 'total' | 'comercial' | 'consumo' | 'vivienda' | 'tarjeta' | 'consumo_norev';

interface Props {
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
  sofipos: {
    fechas: string[];
    cartera: {
      total: number[];
      comercial: number[];
      consumo: number[];
      vivienda: number[];
    };
    entidades: Array<{ id: string; nombre: string; imor: (number | null)[] }>;
  };
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

export function ImorSegPivotChart({ bm, sofipos }: Props) {
  const [sector, setSector] = useState<Sector>('bm');
  const [view, setView] = useState<'sistema' | 'banco' | 'entidad'>('sistema');
  const [cartera, setCartera] = useState<Cartera>('total');
  const [bancoId, setBancoId] = useState<string>(bm.bancos[0]?.id ?? '');
  const [entidadId, setEntidadId] = useState<string>(sofipos.entidades[0]?.id ?? '');

  const { fechas, values, label, color, yMax } = useMemo(() => {
    if (sector === 'bm') {
      if (view === 'sistema') {
        const v = bm.cartera[cartera] ?? bm.cartera.total;
        return {
          fechas: bm.fechas,
          values: v,
          label: `Banca Múltiple · ${CARTERA_LABELS[cartera]}`,
          color: '#c4a35a',
          yMax: undefined as number | undefined,
        };
      }
      const banco = bm.bancos.find((b) => b.id === bancoId) ?? bm.bancos[0];
      if (!banco) {
        return {
          fechas: bm.fechas,
          values: [] as (number | null)[],
          label: 'Banca Múltiple · (sin datos por banco)',
          color: '#c4a35a',
          yMax: undefined as number | undefined,
        };
      }
      return {
        fechas: bm.fechas,
        values: banco.imor_total,
        label: `Banca Múltiple · ${banco.nombre}`,
        color: '#c4a35a',
        yMax: undefined,
      };
    }
    // sofipos
    if (view === 'sistema') {
      const v = (sofipos.cartera as Record<string, number[] | undefined>)[cartera] ?? sofipos.cartera.total;
      return {
        fechas: sofipos.fechas,
        values: v,
        label: `SoFiPOs · ${CARTERA_LABELS[cartera]}`,
        color: '#f85149',
        yMax: 45,
      };
    }
    const ent = sofipos.entidades.find((e) => e.id === entidadId) ?? sofipos.entidades[0];
    if (!ent) {
      return {
        fechas: sofipos.fechas,
        values: [] as (number | null)[],
        label: 'SoFiPOs · (sin datos por entidad)',
        color: '#f85149',
        yMax: 45 as number | undefined,
      };
    }
    return {
      fechas: sofipos.fechas,
      values: ent.imor,
      label: `SoFiPOs · ${ent.nombre}`,
      color: '#f85149',
      yMax: 45,
    };
  }, [sector, view, cartera, bancoId, entidadId, bm, sofipos]);

  const latest = values[values.length - 1];

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

  function changeSector(next: Sector) {
    setSector(next);
    setView('sistema');
    setCartera('total');
  }

  function changeView(next: 'sistema' | 'banco' | 'entidad') {
    setView(next);
    if (next !== 'sistema') setCartera('total');
  }

  const carteras = sector === 'bm' ? BM_CARTERAS : SOFI_CARTERAS;

  return (
    <ChartErrorBoundary chartName="IMOR pivotable">
      <div className="space-y-3">
        {/* Sector toggle */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => changeSector('bm')} className={pillClass(sector === 'bm')}>
            🏦 Banca Múltiple
          </button>
          <button onClick={() => changeSector('sofipos')} className={pillClass(sector === 'sofipos')}>
            🏘️ SoFiPOs
          </button>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => changeView('sistema')} className={pillClass(view === 'sistema')}>
            Sistema
          </button>
          <button
            onClick={() => changeView(sector === 'bm' ? 'banco' : 'entidad')}
            className={pillClass(view !== 'sistema')}>
            {sector === 'bm' ? 'Por banco' : 'Por entidad'}
          </button>
        </div>

        {/* Sub-selector */}
        {view === 'sistema' && (
          <div className="flex gap-1.5 flex-wrap">
            {carteras.map((c) => (
              <button key={c} onClick={() => setCartera(c)} className={pillClass(cartera === c)}>
                {CARTERA_LABELS[c]}
              </button>
            ))}
          </div>
        )}
        {view === 'banco' && (
          <div className="flex gap-1.5 flex-wrap">
            {bm.bancos.map((b) => (
              <button key={b.id} onClick={() => setBancoId(b.id)} className={pillClass(bancoId === b.id)}>
                {b.nombre}
              </button>
            ))}
          </div>
        )}
        {view === 'entidad' && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-h-24 flex-wrap">
            {sofipos.entidades.map((e) => (
              <button key={e.id} onClick={() => setEntidadId(e.id)} className={pillClass(entidadId === e.id)}>
                {e.nombre}
              </button>
            ))}
          </div>
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
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                },
                y: {
                  min: 0,
                  ...(yMax != null ? { max: yMax } : {}),
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
