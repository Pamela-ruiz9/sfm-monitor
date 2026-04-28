import { useMemo } from 'react';

interface Props {
  /** Source label (e.g. "Banxico", "CNBV"). */
  source: string;
  /** Last updated date in DD/MM/YYYY (matches sfm-data.json convention). */
  lastUpdated: string;
}

function parseDdmmyyyy(s: string): Date | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const day = Number.parseInt(parts[0]!, 10);
  const month = Number.parseInt(parts[1]!, 10);
  const year = Number.parseInt(parts[2]!, 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

export function DataFreshnessBadge({ source, lastUpdated }: Props) {
  const { color, label } = useMemo(() => {
    const date = parseDdmmyyyy(lastUpdated);
    if (!date) {
      return { color: 'bg-slate-500', label: 'sin fecha' };
    }
    const ageHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) {
      return { color: 'bg-emerald-500', label: 'fresco' };
    }
    if (ageHours < 72) {
      return { color: 'bg-amber-500', label: 'reciente' };
    }
    return { color: 'bg-red-500', label: 'desactualizado' };
  }, [lastUpdated]);

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
      <span
        className={`inline-block w-2 h-2 rounded-full ${color}`}
        aria-hidden="true"
      />
      {source} · {lastUpdated} · {label}
    </span>
  );
}
