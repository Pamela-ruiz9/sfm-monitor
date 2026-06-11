// app/src/components/noticias/ContextoBanda.tsx
import type { WbKpi } from '~/data/watchboard-loader';

const KPI_GROUPS: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['recession', 'probability'], label: 'Riesgo recesión EE.UU.' },
  { keywords: ['brent', 'oil', 'crude'],    label: 'Petróleo Brent' },
  { keywords: ['fomc', 'fed', 'federal reserve'], label: 'Perspectiva Fed' },
  { keywords: ['tariff', 'section 122', 'cliff'], label: 'Aranceles / Cliff' },
];

const COLOR_HEX: Record<string, string> = {
  red: '#f85149',
  amber: '#e3b341',
  green: '#56d364',
  blue: '#58a6ff',
};

function truncate(s: string, max = 28): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

interface SelectedKpi extends WbKpi {
  spanishLabel: string;
}

function selectKpis(kpis: WbKpi[]): SelectedKpi[] {
  const selected: SelectedKpi[] = [];
  const used = new Set<string>();

  for (const group of KPI_GROUPS) {
    const found = kpis.find(
      (k) =>
        !used.has(k.id) &&
        group.keywords.some((kw) => k.label.toLowerCase().includes(kw)),
    );
    if (found) {
      selected.push({ ...found, spanishLabel: group.label });
      used.add(found.id);
    }
  }

  for (const k of kpis) {
    if (selected.length >= 4) break;
    if (!used.has(k.id)) {
      selected.push({ ...k, spanishLabel: truncate(k.label) });
      used.add(k.id);
    }
  }

  return selected.slice(0, 4);
}

interface Props {
  rawKpis: WbKpi[];
}

export function ContextoBanda({ rawKpis }: Props) {
  const kpis = selectKpis(rawKpis);

  if (kpis.length === 0) return null;

  return (
    <div className="rounded-lg border p-3 mb-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elev)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-mute)' }}>
          Contexto global
        </span>
        <a
          href="https://watchboard.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] hover:underline"
          style={{ color: 'var(--color-accent)' }}
        >
          via Watchboard ↗
        </a>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {kpis.map((kpi) => {
          const color = COLOR_HEX[kpi.color] ?? 'var(--color-text)';
          return (
            <div key={kpi.id}>
              <div className="text-[10px] leading-tight" style={{ color: 'var(--color-text-mute)' }}>
                {kpi.spanishLabel}
              </div>
              <div className="text-xs font-medium leading-tight" style={{ color: 'var(--color-text)' }}>
                <span aria-hidden="true" style={{ color }}>● </span>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
