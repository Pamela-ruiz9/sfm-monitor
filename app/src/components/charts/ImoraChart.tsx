import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

interface BancoPivot {
  id: string;
  nombre: string;
  values: (number | null)[];
}

interface Props {
  fechas: string[];
  values: (number | null)[];
  bancos?: BancoPivot[];
}

const DEFAULT_CRISES = [
  { start: '1994-12', end: '1995-12', label: 'Tequila' },
  { start: '2008-09', end: '2009-06', label: 'GFC' },
  { start: '2020-03', end: '2020-06', label: 'COVID' },
] as const;

function pillClass(active: boolean): string {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-[--color-gold-soft] text-[--color-gold] border-[--color-gold]/40'
      : 'text-[--color-text-mute] border-[--color-border] hover:text-[--color-text-dim] hover:border-[--color-border-soft]',
  );
}

function hasData(series: (number | null)[]): boolean {
  return series.some((v) => v !== null && v !== undefined && v > 0);
}

export function ImoraChart({ fechas, values, bancos }: Props) {
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => hasData(b.values)),
    [bancos],
  );

  const [view, setView] = useState<'sistema' | 'banco'>('sistema');
  const [bancoId, setBancoId] = useState<string>(bancosConDatos[0]?.id ?? '');

  const { activeValues, activeLabel } = useMemo(() => {
    if (view === 'banco' && bancosConDatos.length > 0) {
      const banco = bancosConDatos.find((b) => b.id === bancoId) ?? bancosConDatos[0]!;
      return { activeValues: banco.values, activeLabel: `IMORA · ${banco.nombre}` };
    }
    return { activeValues: values, activeLabel: 'IMORA Total' };
  }, [view, bancoId, bancosConDatos, values]);

  // Filter sentinel values: CNBV encodes unreported periods as raw 1.0 → 100% after ×100.
  // Real extreme values come as graduated decimals (e.g. 91.38); exactly 100 = missing data.
  const cleanValues = activeValues.map((v) => (v !== null && v >= 100 ? null : v));
  const nonNullValues = cleanValues.filter((v): v is number => v !== null);
  const maxVal = nonNullValues.length > 0 ? Math.max(...nonNullValues) : 0;
  const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : 10;
  const xMin = fechas.length > 0 ? `${fechas[0]}-01` : undefined;

  const chartData = {
    labels: fechas.map((f) => `${f}-01`),
    datasets: [
      {
        label: activeLabel,
        data: cleanValues,
        borderColor: '#c4a35a',
        backgroundColor: 'rgba(196, 163, 90, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      },
    ],
  };

  const latest = cleanValues[cleanValues.length - 1];

  return (
    <ChartErrorBoundary chartName="IMORA">
      <div className="space-y-3">
        {bancosConDatos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView('sistema')} className={pillClass(view === 'sistema')}>
              Sistema
            </button>
            <button onClick={() => setView('banco')} className={pillClass(view === 'banco')}>
              Por banco
            </button>
          </div>
        )}

        {view === 'banco' && bancosConDatos.length > 0 && (
          <div className="flex gap-1.5 flex-wrap max-h-24 overflow-y-auto pb-1">
            {bancosConDatos.map((b) => (
              <button
                key={b.id}
                onClick={() => setBancoId(b.id)}
                className={pillClass(bancoId === b.id)}
              >
                {b.nombre}
              </button>
            ))}
          </div>
        )}

        {bancosConDatos.length > 0 && (
          <div className="flex items-baseline justify-between border-t border-[--color-border-soft] pt-3">
            <div className="text-[10px] text-[--color-text-mute] uppercase tracking-wider">
              {activeLabel}
            </div>
            <div className="serif tabular text-2xl font-semibold text-[--color-gold]">
              {latest != null ? `${(latest as number).toFixed(2)}%` : '—'}
            </div>
          </div>
        )}

        <div className="h-64 md:h-72 -mx-1">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { labels: { color: '#e2e8f0' } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const y = ctx.parsed.y;
                      return y == null ? '—' : `${y.toFixed(2)}%`;
                    },
                  },
                },
                annotation: {
                  annotations: view === 'sistema'
                    ? Object.fromEntries(
                        DEFAULT_CRISES.map((c, i) => [
                          `crisis-${i}`,
                          {
                            type: 'box',
                            xMin: `${c.start}-01`,
                            xMax: `${c.end}-01`,
                            backgroundColor: 'rgba(148, 163, 184, 0.12)',
                            borderColor: 'rgba(148, 163, 184, 0.3)',
                            borderWidth: 1,
                            label: {
                              display: true,
                              content: c.label,
                              position: 'start',
                              color: '#94a3b8',
                              font: { size: 10 },
                            },
                          },
                        ]),
                      )
                    : {},
                },
              },
              scales: {
                x: {
                  type: 'time',
                  time: { unit: 'year' },
                  ...(xMin ? { min: xMin } : {}),
                  ticks: { color: '#94a3b8' },
                  grid: { color: 'rgba(148, 163, 184, 0.1)' },
                },
                y: {
                  min: 0,
                  max: yMax,
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
