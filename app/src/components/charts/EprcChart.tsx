import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { $selectedBancoId } from '~/stores/bancaState';

interface BancoEntry {
  id: string;
  nombre: string;
  eprc_cartera?: (number | null)[] | undefined;
  eprc_comercial?: (number | null)[] | undefined;
  eprc_consumo?: (number | null)[] | undefined;
  eprc_vivienda?: (number | null)[] | undefined;
}

interface Props {
  fechas: string[];
  eprcCartera: (number | null)[];                    // sistema total
  eprc_comercial?: (number | null)[] | undefined;   // sistema comercial
  eprc_consumo?: (number | null)[] | undefined;     // sistema consumo
  eprc_vivienda?: (number | null)[] | undefined;    // sistema vivienda
  bancos?: BancoEntry[];
}

type Cartera = 'total' | 'comercial' | 'consumo' | 'vivienda';

const COLOR = '#56B4E9';

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

export function EprcChart({ fechas, eprcCartera, eprc_comercial, eprc_consumo, eprc_vivienda, bancos }: Props) {
  const hasCarteraBreakdown = hasData(eprc_comercial) || hasData(eprc_consumo) || hasData(eprc_vivienda);
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => hasData(b.eprc_cartera)),
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
      if (!banco) return eprcCartera;
      if (cartera === 'comercial') return banco.eprc_comercial ?? banco.eprc_cartera ?? eprcCartera;
      if (cartera === 'consumo')   return banco.eprc_consumo   ?? banco.eprc_cartera ?? eprcCartera;
      if (cartera === 'vivienda')  return banco.eprc_vivienda  ?? banco.eprc_cartera ?? eprcCartera;
      return banco.eprc_cartera ?? eprcCartera;
    }
    if (cartera === 'comercial') return eprc_comercial ?? eprcCartera;
    if (cartera === 'consumo')   return eprc_consumo   ?? eprcCartera;
    if (cartera === 'vivienda')  return eprc_vivienda  ?? eprcCartera;
    return eprcCartera;
  }, [view, bancoId, cartera, bancosConDatos, eprcCartera, eprc_comercial, eprc_consumo, eprc_vivienda]);

  const labels = fechas.map((f) => `${f}-01`);
  const nonNull = activeSeries.filter((v): v is number => v !== null);
  const yMax = nonNull.length > 0 ? Math.ceil(Math.max(...nonNull) * 1.2) : 6;

  return (
    <ChartErrorBoundary chartName="EPRC / Cartera">
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
          EPRC (reservas preventivas) como % de la cartera. Complementa el ICOR: mientras ICOR = EPRC / vencida, esta métrica muestra la carga de reservas sobre el portafolio completo.
        </p>
        <div className="h-64 md:h-72 -mx-1">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: 'EPRC / Cartera',
                  data: activeSeries,
                  borderColor: COLOR,
                  backgroundColor: COLOR + '22',
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
                      if (y == null) return '—';
                      return `EPRC / Cartera: ${y.toFixed(2)}%`;
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
                  min: 0,
                  suggestedMax: yMax,
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
      </div>
    </ChartErrorBoundary>
  );
}
