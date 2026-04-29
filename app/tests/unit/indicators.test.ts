import { describe, expect, it } from 'vitest';
import { INDICATORS, getIndicator, searchIndicators } from '~/data/indicators';

describe('indicator registry', () => {
  it('all ids are unique', () => {
    const ids = INDICATORS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every indicator has source attribution', () => {
    for (const i of INDICATORS) {
      expect(i.source).toBeTruthy();
      expect(i.label).toBeTruthy();
    }
  });

  it('getIndicator returns the right indicator', () => {
    const fx = getIndicator('fx');
    expect(fx?.label).toContain('Tipo de cambio');
  });

  it('getIndicator returns undefined for unknown id', () => {
    expect(getIndicator('nope-not-real')).toBeUndefined();
  });

  it('searchIndicators matches by alias', () => {
    const matches = searchIndicators('SF43718');
    expect(matches.some((m) => m.id === 'fx')).toBe(true);
  });

  it('searchIndicators is case-insensitive', () => {
    const lower = searchIndicators('imor');
    const upper = searchIndicators('IMOR');
    expect(upper.length).toBe(lower.length);
  });

  it('searchIndicators returns empty array for empty query', () => {
    expect(searchIndicators('')).toEqual([]);
  });
});
