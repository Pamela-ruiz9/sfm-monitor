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
  cartera_total_mmp?: (number | null)[] | undefined;
}

interface Props {
  fechas: string[];       // YYYY-MM
  yoy: (number | null)[]; // variación % anual — sistema
  mmp: (number | null)[]; // saldo MMP — sistema (para tooltip)
  bancos?: BancoEntry[];
}

function pillClass(active: boolean): string {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-(--color-gold-soft) text-(--color-gold) border-(--color-gold)/40'
      : 'text-(--color-text-mute) border-(--color-border) hover:text-(--color-text-dim) hover:border-(--color-border-soft)',
  );
}

function computeYoy(vals: (number | null)[]): (number | null)[] {
  return vals.map((v, i) => {
    if (i < 12 || v == null) return null;
    const prev = vals[i - 12];
    if (prev == null || prev === 0) return null;
    return Math.round(((v - prev) / prev) * 10000) / 100;
  });
}

function hasData(s: (number | null)[] | undefined): boolean {
  return s?.some((v) => v !== null && v !== undefined) ?? false;
}

export function CarteraCrecimientoChart({ fechas, yoy, mmp, bancos }: Props) {
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => hasData(b.cartera_total_mmp)),
    [bancos],
  );

  const [view, setView] = useState<'sistema' | 'banco'>('sistema');
  const [bancoId, setBancoId] = useState<string>(bancosConDatos[0]?.id ?? '');

  const externalBancoId = useStore($selectedBancoId);

  useEffect(() => {
    if (!externalBancoId) return;
    const match = bancosConDatos.find((b) => b.id === externalBancoId);
    if (match) {
      setView('banco');
      setBancoId(externalBancoId);
    }
  }, [externalBancoId, bancosConDatos]);

  const { activeYoy, activeMmp } = useMemo(() => {
    if (view === 'banco') {
      const banco = bancosConDatos.find((b) => b.id === bancoId) ?? bancosConDatos[0];
      if (banco?.cartera_total_mmp) {
        return {
          activeYoy: computeYoy(banco.cartera_total_mmp),
          activeMmp: banco.cartera_total_mmp,
        };
      }
    }
    return { activeYoy: yoy, activeMmp: mmp };
  }, [view, bancoId, bancosConDatos, yoy, mmp]);

  const points = fechas.map((f, i) => ({ x: `${f}-15`, y: activeYoy[i] ?? null }));

  const data = {
    datasets: [
      {
        label: 'Crecimiento anual cartera',
        data: points,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: false,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Crecimiento de cartera">
      <div className="space-y-3">
        {bancosConDatos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('sistema')} className={pillClass(view === 'sistema')}>Sistema</button>
            <button onClick={() => setView('banco')} className={pillClass(view === 'banco')}>Por banco</button>
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

        <div className="h-64 md:h-72 -mx-1">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (items) => items[0]?.label?.slice(0, 7) ?? '',
                    label: (ctx) => {
                      const i = ctx.dataIndex;
                      const g = ctx.parsed.y;
                      const s = activeMmp[i];
                      const lines = [];
                      if (g != null) lines.push(`Crecimiento: ${g >= 0 ? '+' : ''}${g.toFixed(2)}%`);
                      if (s != null) lines.push(`Saldo: ${s.toFixed(0)} MMP`);
                      return lines;
                    },
                  },
                },
                annotation: {
                  annotations: {
                    zeroLine: {
                      type: 'line',
                      yMin: 0,
                      yMax: 0,
                      borderColor: 'rgba(148, 163, 184, 0.5)',
                      borderWidth: 1,
                      borderDash: [3, 3],
                    },
                  },
                },
              },
              scales: {
                x: {
                  type: 'time',
                  time: { unit: 'year' },
                  ticks: { color: '#94a3b8', maxTicksLimit: 10 },
                  grid: { color: 'rgba(148, 163, 184, 0.08)' },
                },
                y: {
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
