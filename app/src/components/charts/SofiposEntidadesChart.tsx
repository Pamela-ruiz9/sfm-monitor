import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

// Okabe-Ito CVD-safe palette (8 colors, cycled for up to 15 lines)
// Note: original first color #000000 replaced with #E6194B — black is invisible on dark backgrounds
const OKABE_ITO = [
  '#E6194B',
  '#E69F00',
  '#56B4E9',
  '#009E73',
  '#F0E442',
  '#0072B2',
  '#D55E00',
  '#CC79A7',
];

interface Entidad {
  nombre: string;
  imor: (number | null)[];
}

interface Props {
  fechas: string[];
  entidades: Entidad[]; // pre-filtered to top 15 by caller
}

export function SofiposEntidadesChart({ fechas, entidades }: Props) {
  const [activeNames, setActiveNames] = useState<ReadonlySet<string>>(
    () => new Set(entidades.map((e) => e.nombre)),
  );

  const allSelected = activeNames.size === entidades.length;
  const noneSelected = activeNames.size === 0;

  function selectAll() {
    setActiveNames(new Set(entidades.map((e) => e.nombre)));
  }

  function selectNone() {
    setActiveNames(new Set());
  }

  function toggleEntidad(nombre: string) {
    setActiveNames((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) {
        next.delete(nombre);
      } else {
        next.add(nombre);
      }
      return next;
    });
  }

  const labels = fechas.map((f) => `${f}-15`);

  const data = {
    labels,
    datasets: entidades.map((e, i) => ({
      label: e.nombre,
      data: activeNames.has(e.nombre) ? e.imor : [],
      borderColor: OKABE_ITO[i % OKABE_ITO.length],
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.5,
      spanGaps: true,
    })),
  };

  return (
    <ChartErrorBoundary chartName="SoFiPOs IMOR por entidad">
      {/* Selector de entidades */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[--color-text-mute]">
            Entidades
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={selectAll}
              style={{
                color: allSelected ? 'var(--color-gold)' : 'var(--color-text-mute)',
                borderColor: allSelected ? 'var(--color-gold)' : 'var(--color-border)',
                backgroundColor: allSelected
                  ? 'rgba(var(--color-gold-rgb, 212 175 55) / 0.1)'
                  : 'transparent',
              }}
              className="px-2 py-0.5 text-[10px] font-semibold border rounded transition-colors"
            >
              Todas
            </button>
            <button
              onClick={selectNone}
              style={{
                color: noneSelected ? 'var(--color-gold)' : 'var(--color-text-mute)',
                borderColor: noneSelected ? 'var(--color-gold)' : 'var(--color-border)',
                backgroundColor: noneSelected
                  ? 'rgba(var(--color-gold-rgb, 212 175 55) / 0.1)'
                  : 'transparent',
              }}
              className="px-2 py-0.5 text-[10px] font-semibold border rounded transition-colors"
            >
              Ninguna
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {entidades.map((e, i) => {
            const isActive = activeNames.has(e.nombre);
            const color = OKABE_ITO[i % OKABE_ITO.length] ?? '#94a3b8';
            return (
              <button
                key={e.nombre}
                onClick={() => toggleEntidad(e.nombre)}
                style={{
                  borderColor: isActive ? color : 'var(--color-border)',
                  color: isActive ? color : 'var(--color-text-mute)',
                  opacity: isActive ? 1 : 0.5,
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] border rounded transition-all"
                title={e.nombre}
              >
                <span
                  style={{ backgroundColor: isActive ? color : 'var(--color-border)' }}
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                />
                <span className="max-w-[80px] truncate">{e.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-64 md:h-72 -mx-1">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (!activeNames.has(ctx.dataset.label ?? '')) return '';
                    const y = ctx.parsed.y;
                    return y == null
                      ? `${ctx.dataset.label}: —`
                      : `${ctx.dataset.label}: ${y.toFixed(2)}%`;
                  },
                },
                filter: (item) => activeNames.has(item.dataset.label ?? ''),
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
                ticks: { color: '#94a3b8', callback: (v) => `${v}%` },
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
              },
            },
          }}
        />
      </div>
    </ChartErrorBoundary>
  );
}
