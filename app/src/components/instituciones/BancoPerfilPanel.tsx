import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Line } from 'react-chartjs-2';
import { $selectedBancoId } from '~/stores/bancaState';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';

export interface BancoPerfilItem {
  id: string;
  nombre: string;
  imor_latest: number | null;
  imora_latest: number | null;
  imor_total: (number | null)[];
  imor_comercial: (number | null)[];
  imor_consumo: (number | null)[];
  imor_vivienda: (number | null)[];
  imor_tarjeta: (number | null)[];
  icor_total: (number | null)[];
  roa: (number | null)[];
  roe: (number | null)[];
}

interface Props {
  bancos: BancoPerfilItem[];
  fechas: string[];
  sistemaImor: number | null;
  sistemaImora: number | null;
}

type Cartera = 'total' | 'comercial' | 'consumo' | 'vivienda' | 'tarjeta';

const CARTERA_LABELS: Record<Cartera, string> = {
  total: 'Total',
  comercial: 'Comercial',
  consumo: 'Consumo',
  vivienda: 'Vivienda',
  tarjeta: 'Tarjeta',
};

const CARTERA_COLORS: Record<Cartera, string> = {
  total: '#d29922',
  comercial: '#58a6ff',
  consumo: '#f85149',
  vivienda: '#56d364',
  tarjeta: '#bc8cff',
};

function lastNonNull(arr: (number | null)[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined) return arr[i]!;
  }
  return null;
}

function pillClass(active: boolean): string {
  return cn(
    'px-2.5 py-0.5 text-[10px] font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-(--color-gold-soft) text-(--color-gold) border-(--color-gold)/40'
      : 'text-(--color-text-mute) border-(--color-border) hover:text-(--color-text-dim)',
  );
}

export function BancoPerfilPanel({ bancos, fechas, sistemaImor, sistemaImora }: Props) {
  const selectedId = useStore($selectedBancoId);
  const [cartera, setCartera] = useState<Cartera>('total');

  const banco = useMemo(
    () => bancos.find((b) => b.id === selectedId) ?? null,
    [bancos, selectedId],
  );

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    $selectedBancoId.set(e.target.value);
    setCartera('total');
  }, []);

  const handleClose = useCallback(() => {
    $selectedBancoId.set('');
  }, []);

  // Mini chart: last 36 months
  const WINDOW = 36;
  const slicedFechas = fechas.slice(-WINDOW);
  const serieForCartera = (b: BancoPerfilItem): (number | null)[] => {
    const map: Record<Cartera, (number | null)[]> = {
      total: b.imor_total,
      comercial: b.imor_comercial,
      consumo: b.imor_consumo,
      vivienda: b.imor_vivienda,
      tarjeta: b.imor_tarjeta,
    };
    return (map[cartera] ?? b.imor_total).slice(-WINDOW);
  };

  const icor = banco ? lastNonNull(banco.icor_total) : null;
  const roa  = banco ? lastNonNull(banco.roa) : null;
  const roe  = banco ? lastNonNull(banco.roe) : null;

  return (
    <div
      className="rounded-xl border mb-6 overflow-hidden"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elev)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: 'var(--color-text-mute)' }}>
          Vista por institucion
        </span>
        <select
          value={selectedId}
          onChange={handleSelect}
          className="flex-1 text-sm font-medium rounded-md px-2 py-1 border"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            borderColor: 'var(--color-border)',
          }}
        >
          <option value="">— Seleccionar banco —</option>
          {bancos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nombre}
            </option>
          ))}
        </select>
        {selectedId && (
          <button
            onClick={handleClose}
            className="text-xs shrink-0"
            style={{ color: 'var(--color-text-mute)', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Cerrar panel"
          >
            x
          </button>
        )}
      </div>

      {/* Content — only when banco selected */}
      {banco && (
        <div className="px-4 py-3 space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {[
              { label: 'IMOR', value: banco.imor_latest, suffix: '%', decimals: 2, sistemaVal: sistemaImor, lowerBetter: true },
              { label: 'IMORA', value: banco.imora_latest, suffix: '%', decimals: 2, sistemaVal: sistemaImora, lowerBetter: true },
              { label: 'ICOR', value: icor, suffix: 'x', decimals: 1, sistemaVal: null, lowerBetter: false },
              { label: 'ROA', value: roa, suffix: '%', decimals: 2, sistemaVal: null, lowerBetter: false },
              { label: 'ROE', value: roe, suffix: '%', decimals: 1, sistemaVal: null, lowerBetter: false },
            ].map(({ label, value, suffix, decimals, sistemaVal, lowerBetter }) => (
              <div
                key={label}
                className="rounded-lg p-2 text-center"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border-soft)' }}
              >
                <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-mute)' }}>
                  {label}
                </div>
                <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
                  {value != null ? `${value.toFixed(decimals)}${suffix}` : '—'}
                </div>
                {sistemaVal != null && value != null && (
                  <div className="text-[8px] mt-0.5" style={{ color: 'var(--color-text-mute)' }}>
                    <span>sis {sistemaVal.toFixed(decimals)}{suffix}</span>
                    {(() => {
                      const delta = value - sistemaVal;
                      const isGood = lowerBetter ? delta < 0 : delta > 0;
                      return (
                        <span className="ml-1 font-semibold" style={{ color: isGood ? 'var(--color-green)' : 'var(--color-red)' }}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(decimals)}pp
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cartera pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(['total', 'comercial', 'consumo', 'vivienda', 'tarjeta'] as Cartera[]).map((c) => (
              <button key={c} onClick={() => setCartera(c)} className={pillClass(cartera === c)}>
                {CARTERA_LABELS[c]}
              </button>
            ))}
          </div>

          {/* Mini chart */}
          <div className="h-44 -mx-1">
            <Line
              data={{
                labels: slicedFechas.map((f) => `${f}-15`),
                datasets: [
                  {
                    label: `IMOR ${CARTERA_LABELS[cartera]}`,
                    data: serieForCartera(banco),
                    borderColor: CARTERA_COLORS[cartera],
                    backgroundColor: CARTERA_COLORS[cartera] + '15',
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
                        return y == null ? '—' : `IMOR ${CARTERA_LABELS[cartera]}: ${y.toFixed(2)}%`;
                      },
                    },
                  },
                },
                scales: {
                  x: {
                    type: 'time',
                    time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
                    ticks: { color: '#94a3b8', maxTicksLimit: 6 },
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
      )}

      {/* Placeholder when nothing selected */}
      {!banco && (
        <div className="px-4 py-6 text-center text-xs" style={{ color: 'var(--color-text-mute)' }}>
          Selecciona un banco para ver su perfil completo. Los charts de abajo se sincronizaran automaticamente.
        </div>
      )}
    </div>
  );
}
