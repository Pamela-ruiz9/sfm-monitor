import { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

interface BancoPivot {
  id: string;
  nombre: string;
  roa: (number | null)[];
  roe: (number | null)[];
}

interface Props {
  fechas: string[];              // 'YYYY-MM'
  roa: (number | null)[];        // % sistema
  roe: (number | null)[];        // % sistema
  bancos?: BancoPivot[];
}

function pillClass(active: boolean): string {
  return cn(
    'px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap',
    active
      ? 'bg-(--color-gold-soft) text-(--color-gold) border-(--color-gold)/40'
      : 'text-(--color-text-mute) border-(--color-border) hover:text-(--color-text-dim) hover:border-(--color-border-soft)',
  );
}

const DEFAULT_CRISES = [
  { start: '1994-12', end: '1995-12', label: 'Tequila' },
  { start: '2008-09', end: '2009-06', label: 'GFC' },
  { start: '2020-03', end: '2020-06', label: 'COVID' },
] as const;

export function RoaRoeChart({ fechas, roa, roe, bancos }: Props) {
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => b.roa.some((v) => v !== null) || b.roe.some((v) => v !== null)),
    [bancos],
  );

  const [view, setView] = useState<'sistema' | 'banco'>('sistema');
  const [bancoId, setBancoId] = useState<string>(bancosConDatos[0]?.id ?? '');

  const { activeRoa, activeRoe, activeLabel } = useMemo(() => {
    if (view === 'banco' && bancosConDatos.length > 0) {
      const banco = bancosConDatos.find((b) => b.id === bancoId) ?? bancosConDatos[0]!;
      return { activeRoa: banco.roa, activeRoe: banco.roe, activeLabel: banco.nombre };
    }
    return { activeRoa: roa, activeRoe: roe, activeLabel: 'Sistema' };
  }, [view, bancoId, bancosConDatos, roa, roe]);

  const labels = fechas.map((f) => `${f}-01`);
  const xMin = fechas.length > 0 ? `${fechas[0]}-01` : undefined;

  const data = {
    labels,
    datasets: [
      {
        label: `ROA · ${activeLabel}`,
        data: activeRoa,
        borderColor: '#3fb950',
        backgroundColor: 'rgba(63, 185, 80, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: `ROE · ${activeLabel}`,
        data: activeRoe,
        borderColor: '#c4a35a',
        backgroundColor: 'rgba(196, 163, 90, 0.08)',
        fill: false,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="ROA/ROE">
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
            <button key={b.id} onClick={() => setBancoId(b.id)} className={pillClass(bancoId === b.id)}>
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
              legend: { labels: { color: '#e2e8f0' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const y = ctx.parsed.y;
                    return y == null ? '—' : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
                  },
                },
              },
              annotation: {
                annotations: view === 'sistema' ? Object.fromEntries(
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
                ) : {},
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
                position: 'left',
                ticks: { color: '#3fb950', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                title: {
                  display: true,
                  text: 'ROA',
                  color: '#3fb950',
                  font: { size: 10 },
                },
              },
              y1: {
                position: 'right',
                suggestedMin: 0,
                ticks: { color: '#c4a35a', callback: (v) => `${v}%` },
                grid: { drawOnChartArea: false },
                title: {
                  display: true,
                  text: 'ROE',
                  color: '#c4a35a',
                  font: { size: 10 },
                },
              },
            },
          }}
        />
      </div>
      </div>
    </ChartErrorBoundary>
  );
}
