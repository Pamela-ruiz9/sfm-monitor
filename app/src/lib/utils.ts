import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a Mexican peso amount, with sensible defaults for FX rates.
 */
export function formatMxn(n: number, decimals = 4): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/**
 * Format as a percentage with N decimals (does NOT multiply by 100 — the
 * input is assumed to already be a percentage value, e.g. 6.75 → "6.75%").
 */
export function formatPct(n: number, decimals = 2): string {
  return `${n.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Threshold below which a delta is considered flat (no meaningful change).
 * 0.0001 covers basis points and percentage points without false-flagging
 * floating-point noise. Override per-indicator if needed in the future.
 */
const FLAT_DELTA_THRESHOLD = 0.0001;

/**
 * Compute delta between the latest value and the previous value in a series.
 * Returns the raw difference plus formatted deltas. Returns null if series
 * has fewer than 2 points.
 */
export function computeDelta(
  values: readonly number[],
): { abs: number; pct: number; direction: 'up' | 'down' | 'flat' } | null {
  if (values.length < 2) return null;
  const last = values[values.length - 1]!;
  const prev = values[values.length - 2]!;
  const abs = last - prev;
  const pct = prev === 0 ? 0 : (abs / prev) * 100;
  const direction =
    abs > FLAT_DELTA_THRESHOLD ? 'up' : abs < -FLAT_DELTA_THRESHOLD ? 'down' : 'flat';
  return { abs, pct, direction };
}

/**
 * DD/MM/YYYY → ISO YYYY-MM-DD. Returns null on malformed input.
 */
export function ddmmyyyyToIso(s: string): string | null {
  const parts = s.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
