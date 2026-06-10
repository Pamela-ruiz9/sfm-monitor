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
    <div className="rounded-lg border p-3 mb-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elev)' }}>
      <div className="text-[9px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-mute)' }}>
        Contexto global · Watchboard
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {kpis.map((kpi) => (
          <div key={kpi.id}>
            <div className="text-[10px] leading-tight" style={{ color: 'var(--color-text-mute)' }}>
              {kpi.label}
            </div>
            <div className="text-sm font-bold leading-tight" style={{ color: COLOR_CLASS[kpi.color] ?? 'var(--color-text)' }}>
              {kpi.value}
              {kpi.delta && (
                <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--color-text-mute)' }}>
                  {kpi.delta}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
