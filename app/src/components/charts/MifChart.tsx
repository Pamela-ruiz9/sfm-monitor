import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { cn } from '~/lib/utils';
import '~/components/charts/chartSetup';
import { $selectedBancoId } from '~/stores/bancaState';

interface BanxicoPoint {
  fecha: string; // 'YYYY-MM-DD'
  valor: number;
}

interface BancoEntry {
  id: string;
  nombre: string;
  mif?: (number | null)[] | undefined;
  tasa_activa?: (number | null)[] | undefined;
}

interface Props {
  fechas: string[];               // 'YYYY-MM'
  tasaActiva: (number | null)[];  // % rendimiento cartera
  tasaPasiva: (number | null)[];  // % costo fondeo
  mif: (number | null)[];         // % margen intermediación
  tasaBanxico?: BanxicoPoint[];   // historico de decisiones (step line)
  bancos?: BancoEntry[];
}

// Okabe-Ito palette entries
const COLOR_ACTIVA  = '#E69F00';
const COLOR_PASIVA  = '#56B4E9';
const COLOR_MIF     = '#009E73';
const COLOR_BANXICO = '#CC79A7';

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

export function MifChart({ fechas, tasaActiva, tasaPasiva, mif, tasaBanxico, bancos }: Props) {
  const bancosConDatos = useMemo(
    () => (bancos ?? []).filter((b) => hasData(b.mif) || hasData(b.tasa_activa)),
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

  const toPoints = (arr: (number | null)[], dates: string[]) =>
    arr.map((y, i) => ({ x: dates[i]! + '-01', y }));

  const datasets = useMemo(() => {
    if (view === 'banco') {
      const banco = bancosConDatos.find((b) => b.id === bancoId) ?? bancosConDatos[0];
      if (!banco) return [];
      const ds = [];
      if (banco.tasa_activa) {
        ds.push({
          label: `Tasa activa · ${banco.nombre}`,
          data: toPoints(banco.tasa_activa, fechas),
          borderColor: COLOR_ACTIVA,
          backgroundColor: COLOR_ACTIVA + '22',
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          spanGaps: true,
        });
      }
      if (banco.mif) {
        ds.push({
          label: `MIF · ${banco.nombre}`,
          data: toPoints(banco.mif, fechas),
          borderColor: COLOR_MIF,
          backgroundColor: COLOR_MIF + '22',
          borderWidth: 2,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.3,
          spanGaps: true,
        });
      }
      return ds;
    }

    return [
      {
        label: 'Tasa activa implícita',
        data: toPoints(tasaActiva, fechas),
        borderColor: COLOR_ACTIVA,
        backgroundColor: COLOR_ACTIVA + '22',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'Tasa pasiva implícita',
        data: toPoints(tasaPasiva, fechas),
        borderColor: COLOR_PASIVA,
        backgroundColor: COLOR_PASIVA + '22',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: 'MIF',
        data: toPoints(mif, fechas),
        borderColor: COLOR_MIF,
        backgroundColor: COLOR_MIF + '22',
        borderWidth: 2,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.3,
        spanGaps: true,
      },
      ...(tasaBanxico
        ? [{
            label: 'Tasa Banxico',
            data: tasaBanxico.map((p) => ({ x: p.fecha, y: p.valor })),
            borderColor: COLOR_BANXICO,
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0,
            stepped: true as const,
            spanGaps: true,
          }]
        : []),
    ];
  }, [view, bancoId, bancosConDatos, fechas, tasaActiva, tasaPasiva, mif, tasaBanxico]);

  return (
    <ChartErrorBoundary chartName="MIF">
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
            data={{ datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const y = ctx.parsed.y;
                      if (y == null) return '—';
                      return `${ctx.dataset.label}: ${y.toFixed(2)}%`;
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
