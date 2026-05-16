/**
 * BancosTable — Issue #36
 *
 * Tabla interactiva de IMOR por banco (Banca Múltiple CNBV Sector 40).
 * Muestra hasta 62 instituciones con sparklines ECharts, semáforo y variación anual.
 *
 * Columnas:
 *   Banco | IMOR actual | IMOR hace 12m | Δ 12m | Sparkline | Semáforo
 *
 * Responsive:
 *   - Desktop: todas las columnas visibles
 *   - Mobile: oculta Δ 12m y Sparkline, muestra solo Banco + IMOR + Semáforo
 *
 * Semáforo: 🟢 < 3% | 🟡 3–6% | 🔴 > 6%
 */

'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BancoEntry {
  id: string;
  nombre: string;
  imor_total: (number | null)[];
  imor_latest?: { valor: number; fecha: string } | null;
}

interface Props {
  fechas: string[];
  bancos: Record<string, BancoEntry>;
}

type SortKey = 'nombre' | 'imor_actual' | 'imor_12m' | 'delta_12m';
type SortDir = 'asc' | 'desc';

interface RowData {
  id: string;
  nombre: string;
  imor_actual: number | null;
  imor_12m: number | null;
  delta_12m: number | null;
  series24: (number | null)[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSemaforo(val: number | null): { emoji: string; color: string; label: string } {
  if (val === null) return { emoji: '⚫', color: 'var(--color-text-mute, #6b7280)', label: 'N/D' };
  if (val < 3) return { emoji: '🟢', color: 'var(--color-green, #22c55e)', label: 'Bajo' };
  if (val < 6) return { emoji: '🟡', color: 'var(--color-yellow, #fbbf24)', label: 'Moderado' };
  return { emoji: '🔴', color: 'var(--color-red, #ef4444)', label: 'Alto' };
}

function formatPct(val: number | null): string {
  if (val === null) return '—';
  return `${val.toFixed(2)}%`;
}

function formatDelta(val: number | null): string {
  if (val === null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}pp`;
}

function buildRows(fechas: string[], bancos: Record<string, BancoEntry>): RowData[] {
  const rows: RowData[] = [];

  for (const banco of Object.values(bancos)) {
    const series = banco.imor_total;
    const len = series.length;

    // Latest non-null value
    let imor_actual: number | null = null;
    let actualIdx = -1;
    for (let i = len - 1; i >= 0; i--) {
      if (series[i] !== null && series[i] !== undefined) {
        imor_actual = series[i]!;
        actualIdx = i;
        break;
      }
    }

    // 12 months ago from actualIdx
    const idx12m = actualIdx - 12;
    const imor_12m = idx12m >= 0 ? (series[idx12m] ?? null) : null;
    const delta_12m =
      imor_actual !== null && imor_12m !== null ? imor_actual - imor_12m : null;

    // Last 24 months of series (for sparkline)
    const startSpark = Math.max(0, len - 24);
    const series24 = series.slice(startSpark);

    rows.push({
      id: banco.id,
      nombre: banco.nombre,
      imor_actual,
      imor_12m,
      delta_12m,
      series24,
    });
  }

  return rows;
}

function sortRows(rows: RowData[], key: SortKey, dir: SortDir): RowData[] {
  const sorted = [...rows].sort((a, b) => {
    let av: string | number | null;
    let bv: string | number | null;

    if (key === 'nombre') {
      av = a.nombre.toLowerCase();
      bv = b.nombre.toLowerCase();
      return dir === 'asc'
        ? (av as string).localeCompare(bv as string)
        : (bv as string).localeCompare(av as string);
    }

    av = a[key];
    bv = b[key];

    // Nulls go last always
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;

    return dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });
  return sorted;
}

// ─── Sparkline cell ───────────────────────────────────────────────────────────

interface SparklineProps {
  series: (number | null)[];
  color: string;
}

function Sparkline({ series, color }: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;
    let chart: import('echarts').ECharts | null = null;
    let cancelled = false;

    (async () => {
      const echarts = await import('echarts');
      if (cancelled || !ref.current) return;

      chart = echarts.init(ref.current, null, { renderer: 'svg', width: 80, height: 32 });

      const data = series.map((v, i) => [i, v]);

      chart.setOption({
        animation: false,
        grid: { top: 2, bottom: 2, left: 2, right: 2 },
        xAxis: { type: 'category', show: false, boundaryGap: false },
        yAxis: { type: 'value', show: false },
        series: [
          {
            type: 'line',
            data,
            showSymbol: false,
            lineStyle: { color, width: 1.5 },
            areaStyle: { color, opacity: 0.08 },
            connectNulls: false,
          },
        ],
      });
    })();

    return () => {
      cancelled = true;
      chart?.dispose();
    };
  }, [series, color]);

  return <div ref={ref} style={{ width: 80, height: 32, display: 'inline-block' }} />;
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_VISIBLE = 20;

export function BancosTable({ fechas, bancos }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('imor_actual');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showAll, setShowAll] = useState(false);

  const allRows = buildRows(fechas, bancos);
  const sorted = sortRows(allRows, sortKey, sortDir);
  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE);
  const totalBancos = allRows.length;

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'nombre' ? 'asc' : 'desc');
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) {
      return <span style={{ opacity: 0.3, fontSize: 10 }}>⇅</span>;
    }
    return <span style={{ fontSize: 10, color: 'var(--color-gold, #fbbf24)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-text-mute, #9ca3af)',
    borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.08))',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    background: 'transparent',
  };

  const thStyleRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: 13,
    borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.05))',
    color: 'var(--color-text, #e5e7eb)',
    verticalAlign: 'middle',
  };

  const tdStyleRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' };

  if (totalBancos === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--color-text-mute, #9ca3af)' }}>
        Sin datos disponibles.
      </p>
    );
  }

  return (
    <div>
      {/* Scroll wrapper for small screens */}
      <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--color-border, rgba(255,255,255,0.08))' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort('nombre')}>
                Banco <SortIcon col="nombre" />
              </th>
              <th style={thStyleRight} onClick={() => handleSort('imor_actual')}>
                IMOR actual <SortIcon col="imor_actual" />
              </th>
              <th style={{ ...thStyleRight, display: 'table-cell' } as React.CSSProperties} className="hide-mobile" onClick={() => handleSort('imor_12m')}>
                Hace 12m <SortIcon col="imor_12m" />
              </th>
              <th style={{ ...thStyleRight, display: 'table-cell' } as React.CSSProperties} className="hide-mobile" onClick={() => handleSort('delta_12m')}>
                Δ 12m <SortIcon col="delta_12m" />
              </th>
              <th style={{ ...thStyle, textAlign: 'center' } as React.CSSProperties} className="hide-mobile">
                Tendencia
              </th>
              <th style={{ ...thStyle, textAlign: 'center', cursor: 'default' } as React.CSSProperties}>
                Nivel
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const sem = getSemaforo(row.imor_actual);
              const deltaPositive = row.delta_12m !== null && row.delta_12m > 0;
              const deltaNeutral = row.delta_12m === null || row.delta_12m === 0;
              const deltaColor = deltaNeutral
                ? 'var(--color-text-mute, #9ca3af)'
                : deltaPositive
                ? 'var(--color-red, #ef4444)'
                : 'var(--color-green, #22c55e)';

              return (
                <tr
                  key={row.id}
                  style={{ transition: 'background 0.1s' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500 }}>{row.nombre}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-mute, #6b7280)', marginLeft: 6 }}>
                      {row.id}
                    </span>
                  </td>
                  <td style={tdStyleRight}>
                    <span style={{ color: sem.color, fontWeight: 600 }}>
                      {formatPct(row.imor_actual)}
                    </span>
                  </td>
                  <td style={tdStyleRight} className="hide-mobile">
                    {formatPct(row.imor_12m)}
                  </td>
                  <td style={{ ...tdStyleRight, color: deltaColor } as React.CSSProperties} className="hide-mobile">
                    {formatDelta(row.delta_12m)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', padding: '4px 12px' } as React.CSSProperties} className="hide-mobile">
                    <Sparkline series={row.series24} color={sem.color} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' } as React.CSSProperties}>
                    <span
                      title={sem.label}
                      style={{ fontSize: 16 }}
                    >
                      {sem.emoji}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Show all / show less toggle */}
      {totalBancos > DEFAULT_VISIBLE && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            onClick={() => setShowAll((s) => !s)}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border, rgba(255,255,255,0.12))',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 12,
              color: 'var(--color-text-mute, #9ca3af)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'var(--color-gold, #fbbf24)';
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-gold, #fbbf24)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'var(--color-border, rgba(255,255,255,0.12))';
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-text-mute, #9ca3af)';
            }}
          >
            {showAll
              ? `Mostrar top ${DEFAULT_VISIBLE}`
              : `Ver los ${totalBancos} bancos`}
          </button>
          <p style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-mute, #6b7280)' }}>
            {showAll
              ? `Mostrando ${totalBancos} instituciones`
              : `Mostrando ${DEFAULT_VISIBLE} de ${totalBancos} instituciones · Ordenado por IMOR actual`}
          </p>
        </div>
      )}

      {/* Responsive CSS — hide columns on small screens */}
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
