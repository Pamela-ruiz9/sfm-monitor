// app/src/components/noticias/ContextoBanda.tsx
import { useEffect, useState } from 'react';

interface WbKpi {
  id: string;
  label: string;
  value: string;
  color: string;
  delta?: string;
}

interface WbKpisResponse {
  kpis: WbKpi[];
}

const KPI_KEYWORD_GROUPS = [
  ['recession', 'probability'],
  ['brent', 'oil', 'crude'],
  ['fomc', 'fed', 'federal reserve'],
  ['tariff', 'section 122', 'cliff'],
];

const COLOR_CLASS: Record<string, string> = {
  red: '#f85149',
  amber: '#e3b341',
  green: '#56d364',
  blue: '#58a6ff',
};

function truncate(s: string, max = 28): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

function selectKpis(kpis: WbKpi[]): WbKpi[] {
  const selected: WbKpi[] = [];
  const used = new Set<string>();

  for (const group of KPI_KEYWORD_GROUPS) {
    const found = kpis.find(
      (k) =>
        !used.has(k.id) &&
        group.some((kw) => k.label.toLowerCase().includes(kw)),
    );
    if (found) {
      selected.push(found);
      used.add(found.id);
    }
  }

  for (const k of kpis) {
    if (selected.length >= 4) break;
    if (!used.has(k.id)) {
      selected.push(k);
      used.add(k.id);
    }
  }

  return selected.slice(0, 4);
}

export function ContextoBanda() {
  const [kpis, setKpis] = useState<WbKpi[]>([]);

  useEffect(() => {
    fetch('https://watchboard.dev/api/v1/kpis/global-recession-risk.json')
      .then((r) => r.json() as Promise<WbKpisResponse>)
      .then((data) => setKpis(selectKpis(data.kpis ?? [])))
      .catch(() => {});
  }, []);

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
          const color = COLOR_CLASS[kpi.color] ?? 'var(--color-text)';
          return (
            <div key={kpi.id}>
              <div className="text-[10px] leading-tight truncate" style={{ color: 'var(--color-text-mute)' }}>
                {truncate(kpi.label)}
              </div>
              <div className="text-xs font-bold leading-tight" style={{ color }}>
                <span aria-hidden="true">● </span>
                {kpi.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
