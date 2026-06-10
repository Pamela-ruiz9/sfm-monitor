import { useState, useEffect } from 'react';

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
  const [ageH, setAgeH] = useState<number | null>(null);

  useEffect(() => {
    const date = parseDdmmyyyy(lastUpdated);
    if (!date) { setAgeH(-1); return; }
    setAgeH((Date.now() - date.getTime()) / (1000 * 60 * 60));
  }, [lastUpdated]);

  let dotClass: string;
  let label: string;
  if (ageH === null) {
    dotClass = 'bg-(--color-text-mute)';
    label = '…';
  } else if (ageH < 0) {
    dotClass = 'bg-(--color-text-mute)';
    label = 'sin fecha';
  } else if (ageH < 24) {
    dotClass = 'bg-(--color-green)';
    label = 'fresco';
  } else if (ageH < 72) {
    dotClass = 'bg-(--color-yellow)';
    label = 'reciente';
  } else {
    dotClass = 'bg-(--color-red)';
    label = 'desactualizado';
  }

  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] text-(--color-text-mute)"
      aria-live="polite">
      <span
        className={`inline-block w-2 h-2 rounded-full ${dotClass}`}
        aria-hidden="true"
      />
      {source} · <span className="tabular">{lastUpdated}</span> · {label}
    </span>
  );
}
