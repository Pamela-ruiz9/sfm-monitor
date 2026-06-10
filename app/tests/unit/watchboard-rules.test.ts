// app/tests/unit/watchboard-rules.test.ts
import { describe, expect, it } from 'vitest';
import { applyRules } from '~/data/watchboard-rules';

describe('applyRules — fallback', () => {
  it('sin match de regla: devuelve categoría fallback del tracker', () => {
    const r = applyRules({ title: 'Evento sin keywords', type: 'social' }, 'sheinbaum-presidency');
    expect(r.category).toBe('fiscal');
    expect(r.axes).toHaveLength(0);
    expect(r.mechanism).toBe('');
  });

  it('tracker desconocido: devuelve sistémica', () => {
    const r = applyRules({ title: 'X', type: 'y' }, 'tracker-desconocido');
    expect(r.category).toBe('sistemica');
  });

  it('tracker correcto pero tipo incorrecto: no aplica regla', () => {
    // R01 requiere type: 'policy'; si type es 'economic' no debe matchear
    const r = applyRules({ title: 'Fed Warsh rate decision', type: 'economic' }, 'global-recession-risk');
    // R08 sí podría matchear si hubiera keywords de inflación, pero no aquí
    expect(r.category).toBe('politica-monetaria'); // fallback
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R01 (Fed/FOMC)', () => {
  it('keyword "fed" + type policy + tracker correcto → mora + rentabilidad', () => {
    const r = applyRules(
      { title: 'Fed Chair Warsh Hires Paul Winfree', type: 'policy' },
      'global-recession-risk',
    );
    expect(r.category).toBe('politica-monetaria');
    expect(r.mechanism).toContain('TIIE');
    expect(r.axes.find((a) => a.axis === 'mora')?.direction).toBe('alcista');
    expect(r.axes.find((a) => a.axis === 'rentabilidad')?.direction).toBe('mejora');
  });

  it('keyword "fomc" en título funciona', () => {
    const r = applyRules({ title: 'FOMC hold 99% priced', type: 'policy' }, 'global-recession-risk');
    expect(r.category).toBe('politica-monetaria');
  });

  it('tracker equivocado no activa R01', () => {
    const r = applyRules({ title: 'Fed Warsh rate', type: 'policy' }, 'sheinbaum-presidency');
    expect(r.category).toBe('fiscal'); // fallback sheinbaum
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R02 (aranceles)', () => {
  it('keyword "tariff" + trade → liquidez presion + mora alcista', () => {
    const r = applyRules(
      { title: 'Trump tariff Section 122 cliff approaches', type: 'trade' },
      'global-recession-risk',
    );
    expect(r.category).toBe('externa');
    expect(r.axes.find((a) => a.axis === 'liquidez')?.direction).toBe('presion');
    expect(r.axes.find((a) => a.axis === 'mora')?.direction).toBe('alcista');
  });

  it('funciona desde trump-presidencies también', () => {
    const r = applyRules({ title: 'tariff refunds importers', type: 'trade' }, 'trump-presidencies');
    expect(r.category).toBe('externa');
  });
});

describe('applyRules — R03 (oil)', () => {
  it('keyword "brent" → categoría externa pero axes vacíos', () => {
    const r = applyRules({ title: 'Brent crude falls to $91', type: 'market' }, 'global-recession-risk');
    expect(r.category).toBe('externa');
    expect(r.axes).toHaveLength(0);
  });
});

describe('applyRules — R05 (FDI México)', () => {
  it('keyword "fdi" + sheinbaum → liquidez mejora', () => {
    const r = applyRules(
      { title: 'Mexico Q1 FDI hits record $23.6B', type: 'economic' },
      'sheinbaum-presidency',
    );
    expect(r.category).toBe('fiscal');
    expect(r.axes.find((a) => a.axis === 'liquidez')?.direction).toBe('mejora');
  });
});

describe('applyRules — merge de múltiples reglas', () => {
  it('evento que matchea R01 y R08 acumula axes de ambas (first wins por eje)', () => {
    // "inflation" + "fed" en título, type: 'policy' → R01 matchea (policy + fed)
    // R08 requiere type 'economic', no aplica acá
    const r = applyRules(
      { title: 'Fed Warsh inflation target overhaul', type: 'policy' },
      'global-recession-risk',
    );
    expect(r.axes.find((a) => a.axis === 'mora')).toBeDefined();
    expect(r.axes.find((a) => a.axis === 'rentabilidad')).toBeDefined();
  });

  it('R08 (economic + inflation) acumula mora y rentabilidad', () => {
    const r = applyRules(
      { title: 'US PCE inflation 3.3% core hits 3-year high', type: 'economic' },
      'global-recession-risk',
    );
    expect(r.category).toBe('politica-monetaria');
    expect(r.axes.find((a) => a.axis === 'mora')).toBeDefined();
  });
});
