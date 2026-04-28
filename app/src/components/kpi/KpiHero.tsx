import type { LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { Tone } from './KpiCard';

interface Props {
  label: string;
  value: string;
  asOf?: string;
  source?: string;
  Icon?: LucideIcon;
  tone: Tone;
  indicatorId?: string;
}

const VALUE_COLOR: Record<Tone, string> = {
  gold: 'text-[--color-gold]',
  green: 'text-[--color-green]',
  yellow: 'text-[--color-yellow]',
  red: 'text-[--color-red]',
};

export function KpiHero({
  label,
  value,
  asOf,
  source,
  Icon,
  tone,
  indicatorId,
}: Props) {
  const href = indicatorId ? `?indicator=${indicatorId}` : undefined;
  const Wrap = href ? 'a' : 'div';
  const wrapProps = href
    ? { href, 'data-drawer-trigger': indicatorId }
    : {};

  return (
    <Wrap
      {...wrapProps}
      data-tone={tone}
      className={cn(
        'card-surface block p-6 transition-all',
        href && 'hover:border-[--color-gold]',
      )}>
      <div className="flex items-center gap-2 text-[--color-text-mute]">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        <div className="text-[10px] font-medium uppercase tracking-[0.12em]">
          {label}
        </div>
      </div>
      <div
        className={cn(
          'serif tabular mt-3 text-[clamp(36px,9vw,52px)] font-semibold tracking-tight leading-none',
          VALUE_COLOR[tone],
        )}>
        {value}
      </div>
      {(asOf || source) && (
        <div className="mt-3 flex items-baseline justify-between text-[11px] text-[--color-text-mute]">
          {asOf && <span>{asOf}</span>}
          {source && <span className="mono">{source}</span>}
        </div>
      )}
    </Wrap>
  );
}
