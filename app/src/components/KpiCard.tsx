import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

export type DeltaDirection = 'up' | 'down' | 'flat';

interface Props {
  label: string;
  value: string;
  unit?: string;
  asOf?: string;
  Icon?: LucideIcon;
  /** Tone tints the icon and the accent line. */
  tone?: 'accent' | 'cyan' | 'amber' | 'emerald' | 'rose';
  delta?:
    | {
        direction: DeltaDirection;
        /** Pre-formatted change (e.g. "+0.12 pp", "-2.4%"). */
        label: string;
        /**
         * Whether 'up' means good or bad. For inflation, 'up' is bad.
         * For coverage ratios, 'up' is good.
         */
        upIsGood?: boolean;
      }
    | null
    | undefined;
  href?: string;
}

const TONE_CLASSES: Record<NonNullable<Props['tone']>, { ring: string; bg: string; text: string }> = {
  accent: {
    ring: 'ring-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
  },
  cyan: {
    ring: 'ring-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
  },
  amber: {
    ring: 'ring-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
  },
  emerald: {
    ring: 'ring-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
  },
  rose: {
    ring: 'ring-rose-500/30',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
  },
};

type DeltaShape = NonNullable<Props['delta']>;

function deltaClasses(d: DeltaShape): { color: string; Icon: LucideIcon } {
  if (d.direction === 'flat') {
    return { color: 'text-slate-400', Icon: Minus };
  }
  const upIsGood = d.upIsGood ?? true;
  const isGood =
    (d.direction === 'up' && upIsGood) || (d.direction === 'down' && !upIsGood);
  return {
    color: isGood ? 'text-emerald-400' : 'text-rose-400',
    Icon: d.direction === 'up' ? ArrowUpRight : ArrowDownRight,
  };
}

export function KpiCard({ label, value, unit, asOf, Icon, tone = 'accent', delta, href }: Props) {
  const t = TONE_CLASSES[tone];
  const Wrap = href ? 'a' : 'div';
  const wrapProps = href ? { href } : {};

  return (
    <Wrap
      {...wrapProps}
      className={cn(
        'group surface relative overflow-hidden rounded-xl p-5 transition-all',
        href && 'hover:ring-1 hover:ring-blue-500/40 hover:translate-y-[-1px]',
      )}>
      <div
        className={cn(
          'absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent to-transparent',
          tone === 'accent' && 'via-blue-500/50',
          tone === 'cyan' && 'via-cyan-500/50',
          tone === 'amber' && 'via-amber-500/50',
          tone === 'emerald' && 'via-emerald-500/50',
          tone === 'rose' && 'via-rose-500/50',
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </div>
          {asOf && <div className="text-[10px] text-slate-500">{asOf}</div>}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2 ring-1', t.bg, t.ring)}>
            <Icon className={cn('size-4', t.text)} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono tabular text-3xl font-semibold tracking-tight text-slate-50">
          {value}
        </span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>

      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {(() => {
            const d = deltaClasses(delta);
            return (
              <>
                <d.Icon className={cn('size-3', d.color)} aria-hidden="true" />
                <span className={cn('font-medium tabular', d.color)}>
                  {delta.label}
                </span>
                <span className="text-slate-500">vs anterior</span>
              </>
            );
          })()}
        </div>
      )}
    </Wrap>
  );
}
