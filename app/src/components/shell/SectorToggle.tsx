'use client';

import { useState } from 'react';
import { cn } from '~/lib/utils';

type Sector = 'bm' | 'sofipos';

interface Props {
  defaultSector?: Sector;
}

function pillClass(active: boolean): string {
  return cn(
    'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border transition-colors',
    active
      ? 'bg-[--color-gold-soft] text-[--color-gold] border-[--color-gold]/40'
      : 'text-[--color-text-mute] border-[--color-border] hover:text-[--color-text-dim] hover:border-[--color-border-soft]',
  );
}

export function SectorToggle({ defaultSector = 'bm' }: Props) {
  const [sector, setSector] = useState<Sector>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('sfm-sector') as Sector | null) ?? defaultSector;
    }
    return defaultSector;
  });

  function handleChange(s: Sector) {
    setSector(s);
    localStorage.setItem('sfm-sector', s);
    document.dispatchEvent(
      new CustomEvent<{ sector: Sector }>('sfm:sector-change', { detail: { sector: s } }),
    );
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <button onClick={() => handleChange('bm')} className={pillClass(sector === 'bm')}>
        <span aria-hidden="true">🏦</span>
        <span>Banca Múltiple</span>
      </button>
      <button onClick={() => handleChange('sofipos')} className={pillClass(sector === 'sofipos')}>
        <span aria-hidden="true">🏘️</span>
        <span>SoFiPOs</span>
      </button>
    </div>
  );
}
