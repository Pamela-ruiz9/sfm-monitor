import { describe, expect, it } from 'vitest';
import {
  computeDelta,
  ddmmyyyyToIso,
  formatMxn,
  formatPct,
} from '~/lib/utils';

describe('formatMxn', () => {
  it('formats with default 4 decimals', () => {
    expect(formatMxn(17.4052)).toBe('17.4052');
  });
  it('respects requested precision', () => {
    expect(formatMxn(17.4052, 2)).toBe('17.41');
  });
});

describe('formatPct', () => {
  it('appends % with 2 decimals default', () => {
    expect(formatPct(6.75)).toBe('6.75%');
  });
  it('handles 0', () => {
    expect(formatPct(0)).toBe('0.00%');
  });
});

describe('computeDelta', () => {
  it('returns null for <2 points', () => {
    expect(computeDelta([])).toBeNull();
    expect(computeDelta([1])).toBeNull();
  });
  it('detects up direction', () => {
    const d = computeDelta([1, 2]);
    expect(d?.direction).toBe('up');
    expect(d?.abs).toBeCloseTo(1);
    expect(d?.pct).toBeCloseTo(100);
  });
  it('detects down direction', () => {
    const d = computeDelta([2, 1]);
    expect(d?.direction).toBe('down');
  });
  it('detects flat direction', () => {
    const d = computeDelta([1, 1]);
    expect(d?.direction).toBe('flat');
  });
  it('handles zero previous without dividing by 0', () => {
    const d = computeDelta([0, 5]);
    expect(d?.pct).toBe(0);
    expect(d?.abs).toBe(5);
  });
});

describe('ddmmyyyyToIso', () => {
  it('converts DD/MM/YYYY to ISO', () => {
    expect(ddmmyyyyToIso('27/04/2026')).toBe('2026-04-27');
  });
  it('zero-pads single digits', () => {
    expect(ddmmyyyyToIso('5/3/2026')).toBe('2026-03-05');
  });
  it('returns null on malformed input', () => {
    expect(ddmmyyyyToIso('not a date')).toBeNull();
    expect(ddmmyyyyToIso('27/04')).toBeNull();
    expect(ddmmyyyyToIso('')).toBeNull();
  });
});
