import { Download } from 'lucide-react';
import type { Indicator } from '~/data/indicators';

interface Props {
  indicator: Indicator;
}

export function DrawerExport({ indicator }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/data/sfm-data.json`}
        download={`sfm-${indicator.id}.json`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[--color-border] bg-[--color-bg-elev-2] text-xs text-[--color-text-dim] hover:text-[--color-text] hover:border-[--color-gold]">
        <Download className="size-3" aria-hidden="true" />
        JSON completo
      </a>
      <span className="text-[10px] text-[--color-text-mute] self-center">
        PNG / CSV próximamente
      </span>
    </div>
  );
}
