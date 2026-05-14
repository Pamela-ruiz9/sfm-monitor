import { Line } from 'react-chartjs-2';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import '~/components/charts/chartSetup';
import { Chart as ChartJS } from 'chart.js';

interface RatePoint {
  fecha: string; // ISO YYYY-MM-DD (current pipeline) or DD/MM/YYYY (legacy pipeline)
  valor: number;
}

interface Props {
  series: RatePoint[];
}

/**
 * Normalize date string to ISO YYYY-MM-DD for chart's time scale.
 * Handles two formats:
 *   - YYYY-MM-DD  (ISO — current Banxico pipeline)
 *   - DD/MM/YYYY (legacy pipeline)
 * Returns null on malformed input so caller can filter.
 */
function normalizeToIso(s: string): string | null {
  if (!s) return null;
  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // Legacy: DD/MM/YYYY
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function TasaBanxicoChart({ series }: Props) {
  const points = series
    .map((p) => {
      const iso = normalizeToIso(p.fecha);
      return iso ? { x: iso, y: p.valor } : null;
    })
    .filter((p): p is { x: string; y: number } => p !== null)
    .sort((a, b) => a.x.localeCompare(b.x));

  const data = {
    datasets: [
      {
        label: 'Tasa objetivo Banxico',
        data: points,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        stepped: 'before' as const,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartErrorBoundary chartName="Tasa Banxico">
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
