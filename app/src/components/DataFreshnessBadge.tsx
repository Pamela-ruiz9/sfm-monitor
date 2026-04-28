import { useMemo } from 'react';

interface Props {
  source: string;
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
  const { dotClass, label } = useMemo(() => {
    const date = parseDdmmyyyy(lastUpdated);
    if (!date) return { dotClass: 'bg-[--color-text-mute]', label: 'sin fecha' };
    const ageH = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (ageH < 24)
      return { dotClass: 'bg-[--color-green]', label: 'fresco' };
    if (ageH < 72)
      return { dotClass: 'bg-[--color-yellow]', label: 'reciente' };
    return { dotClass: 'bg-[--color-red]', label: 'desactualizado' };
  }, [lastUpdated]);

  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] text-[--color-text-mute]"
      aria-live="polite">
      <span
        className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
      {source} · <span className="tabular">{lastUpdated}</span> · {label}
    </span>
  );
}
