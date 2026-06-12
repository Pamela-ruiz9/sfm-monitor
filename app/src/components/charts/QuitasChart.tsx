import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Bar } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { $selectedBancoId } from '~/stores/bancaState';

interface BancoEntry {
  id: string;
  nombre: string;
  quitas_castigos?: (number | null)[] | undefined;
  quitas_comercial?: (number | null)[] | undefined;
  quitas_consumo?: (number | null)[] | undefined;
  quitas_vivienda?: (number | null)[] | undefined;
}

interface Props {
  fechas: string[];
  valores: (number | null)[];                        // sistema total
  quitas_comercial?: (number | null)[] | undefined;  // sistema comercial
  quitas_consumo?: (number | null)[] | undefined;    // sistema consumo
  quitas_vivienda?: (number | null)[] | undefined;   // sistema vivienda
  bancos?: BancoEntry[];
}

type Cartera = 'total' | 'comercial' | 'consumo' | 'vivienda';

const COLOR = '#D55E00';
const COLOR_HOVER = '#E07050';

function pillClass(active: boolean): string {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-(--color-gold-soft) text-(--color-gold) border-(--color-gold)/40'
      : 'text-(--color-text-mute) border-(--color-border) hover:text-(--color-text-dim) hover:border-(--color-border-soft)',
  );
}

function hasData(s: (number | null)[] | undefined): boolean {
  return s?.some((v) => v !== null && v !== undefined) ?? false;
}

export function QuitasChart({ fechas, valores, quitas_comercial, quitas_consumo, quitas_vivienda, bancos }: Props) {
  const hasCarteraBreakdown = hasData(quitas_comercial) || hasData(quitas_consumo) || hasData(quitas_vivienda);
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => hasData(b.quitas_castigos)),
    [bancos],
  );

  const [view, setView] = useState<'sistema' | 'banco'>('sistema');
  const [bancoId, setBancoId] = useState<string>(bancosConDatos[0]?.id ?? '');
  const [cartera, setCartera] = useState<Cartera>('total');

  const externalBancoId = useStore($selectedBancoId);

  useEffect(() => {
    if (!externalBancoId) return;
    const match = bancosConDatos.find((b) => b.id === externalBancoId);
    if (match) {
      setView('banco');
      setBancoId(externalBancoId);
    }
  }, [externalBancoId, bancosConDatos]);

  const activeSeries = useMemo((): (number | null)[] => {
    if (view === 'banco') {
      const banco = bancosConDatos.find((b) => b.id === bancoId) ?? bancosConDatos[0];
      if (!banco) return valores;
      if (cartera === 'comercial') return banco.quitas_comercial ?? banco.quitas_castigos ?? valores;
      if (cartera === 'consumo')   return banco.quitas_consumo  ?? banco.quitas_castigos ?? valores;
      if (cartera === 'vivienda')  return banco.quitas_vivienda ?? banco.quitas_castigos ?? valores;
      return banco.quitas_castigos ?? valores;
    }
    if (cartera === 'comercial') return quitas_comercial ?? valores;
    if (cartera === 'consumo')   return quitas_consumo  ?? valores;
    if (cartera === 'vivienda')  return quitas_vivienda ?? valores;
    return valores;
  }, [view, bancoId, cartera, bancosConDatos, valores, quitas_comercial, quitas_consumo, quitas_vivienda]);

  const labels = fechas.map((f) => `${f}-01`);

  return (
    <ChartErrorBoundary chartName="Quitas y castigos">
      <div className="space-y-3">
        {bancosConDatos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('sistema')} className={pillClass(view === 'sistema')}>Sistema</button>
            <button onClick={() => setView('banco')} className={pillClass(view === 'banco')}>Por banco</button>
          </div>
        )}

        {(hasCarteraBreakdown || view === 'banco') && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCartera('total')}    className={pillClass(cartera === 'total')}>Total</button>
            <button onClick={() => setCartera('comercial')} className={pillClass(cartera === 'comercial')}>Comercial</button>
            <button onClick={() => setCartera('consumo')}   className={pillClass(cartera === 'consumo')}>Consumo</button>
            <button onClick={() => setCartera('vivienda')}  className={pillClass(cartera === 'vivienda')}>Vivienda</button>
          </div>
        )}

        {view === 'banco' && bancosConDatos.length > 0 && (
          <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto pb-1">
            {bancosConDatos.map((b) => (
              <button
                key={b.id}
                onClick={() => { setBancoId(b.id); $selectedBancoId.set(b.id); }}
                className={pillClass(bancoId === b.id)}
              >
                {b.nombre}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-(--color-text-mute)">
          Flujo acumulado 12 meses · miles de millones de pesos (mmdp)
        </p>
        <div className="h-64 md:h-72 -mx-1">
          <Bar
            data={{
              labels,
              datasets: [
                {
                  label: 'Quitas y castigos',
                  data: activeSeries,
                  backgroundColor: COLOR + 'cc',
                  hoverBackgroundColor: COLOR_HOVER,
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
      </div>
    </ChartErrorBoundary>
  );
}
