import { ArrowDownRight, ArrowUpRight, Minus, Activity, Shield, TrendingUp, TrendingDown, Percent, BarChart2, DollarSign, type LucideIcon } from 'lucide-react';

const ICON_MAP = { Activity, Shield, TrendingUp, TrendingDown, Percent, BarChart2, DollarSign } as const;
type IconName = keyof typeof ICON_MAP;
import { cn } from '~/lib/utils';

// Will be moved to ~/data/indicators in Task 8 and imported from there.
export type Tone = 'gold' | 'green' | 'yellow' | 'red';
export type DeltaDirection = 'up' | 'down' | 'flat';

interface Props {
  label: string;
  value: string;
  unit?: string;
  asOf?: string;
  iconName?: IconName;
  tone: Tone;
  delta?:
    | {
        direction: DeltaDirection;
        label: string;
        upIsGood?: boolean;
      }
    | null
    | undefined;
  /** Indicator id, e.g. "fx", "tasa". Used for view-transition-name + drawer link. */
  indicatorId?: string;
}

const VALUE_COLOR: Record<Tone, string> = {
  gold: 'text-[--color-gold]',
  green: 'text-[--color-green]',
  yellow: 'text-[--color-yellow]',
  red: 'text-[--color-red]',
};

function deltaIcon(d: NonNullable<Props['delta']>): {
  color: string;
  Icon: LucideIcon;
} {
  if (d.direction === 'flat') {
    return { color: 'text-[--color-text-mute]', Icon: Minus };
  }
  const upIsGood = d.upIsGood ?? true;
  const isGood =
    (d.direction === 'up' && upIsGood) ||
    (d.direction === 'down' && !upIsGood);
  return {
    color: isGood ? 'text-[--color-green]' : 'text-[--color-red]',
    Icon: d.direction === 'up' ? ArrowUpRight : ArrowDownRight,
  };
}

export function KpiCard({
  label,
  value,
  unit,
  asOf,
  iconName,
  tone,
  delta,
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
      style={
        indicatorId
          ? ({ viewTransitionName: `kpi-${indicatorId}` } as React.CSSProperties)
          : undefined
      }
      className={cn(
        'card-surface group relative block p-5 transition-all',
        href && 'hover:border-[--color-gold] hover:translate-y-[-1px]',
      )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[--color-text-mute]">
            {label}
          </div>
          {asOf && (
            <div className="text-[10px] text-[--color-text-mute]/70 mt-0.5">
              {asOf}
            </div>
          )}
        </div>
        {iconName && ICON_MAP[iconName] && (() => { const Icon = ICON_MAP[iconName]; return <Icon className="size-4 text-[--color-text-mute] group-hover:text-[--color-gold] transition-colors" aria-hidden="true" />; })()}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            'serif tabular text-[clamp(28px,6vw,38px)] font-semibold tracking-tight leading-none',
            VALUE_COLOR[tone],
          )}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[--color-text-dim]">{unit}</span>
        )}
      </div>

      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {(() => {
            const d = deltaIcon(delta);
            return (
              <>
                <d.Icon className={cn('size-3', d.color)} aria-hidden="true" />
                <span className={cn('font-medium tabular', d.color)}>
                  {delta.label}
                </span>
                <span className="text-[--color-text-mute]">vs anterior</span>
              </>
            );
          })()}
        </div>
      )}
    </Wrap>
  );
}
