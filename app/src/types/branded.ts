/**
 * Branded numeric types prevent accidental unit mixing in financial calculations.
 *
 * Example bug this catches at compile time:
 *   const tasa: Percentage = 6.75 as Percentage;
 *   const fx: Currency = 17.40 as Currency;
 *   tasa + fx; // ❌ Type error — different brands.
 *
 * Conversion is always explicit via the helper functions below.
 */

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type Percentage = Brand<number, 'Percentage'>;
export type BasisPoints = Brand<number, 'BasisPoints'>;
export type Currency = Brand<number, 'Currency'>;
export type Ratio = Brand<number, 'Ratio'>;

/**
 * Banxico SIE series identifier. Always starts with "SF" or "SP" followed by digits.
 * Examples: SF43718 (FX FIX), SF61745 (tasa objetivo), SP74625 (INPC subyacente).
 */
export type SeriesId = Brand<string, 'SeriesId'>;

export type IsoDate = Brand<string, 'IsoDate'>;
export type IsoMonth = Brand<string, 'IsoMonth'>;

// ---------- constructors ----------

export const pct = (n: number): Percentage => n as Percentage;
export const bps = (n: number): BasisPoints => n as BasisPoints;
export const mxn = (n: number): Currency => n as Currency;
export const ratio = (n: number): Ratio => n as Ratio;

export const seriesId = (s: string): SeriesId => {
  if (!/^S[FP]\d+$/.test(s)) {
    throw new Error(`Invalid Banxico SIE series ID: ${s}`);
  }
  return s as SeriesId;
};

export const isoDate = (s: string): IsoDate => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid ISO date (YYYY-MM-DD expected): ${s}`);
  }
  return s as IsoDate;
};

export const isoMonth = (s: string): IsoMonth => {
  if (!/^\d{4}-\d{2}$/.test(s)) {
    throw new Error(`Invalid ISO month (YYYY-MM expected): ${s}`);
  }
  return s as IsoMonth;
};

// ---------- conversions ----------

export const pctToBps = (p: Percentage): BasisPoints =>
  (p * 100) as BasisPoints;

export const bpsToPct = (b: BasisPoints): Percentage => (b / 100) as Percentage;

export const ratioToPct = (r: Ratio): Percentage => (r * 100) as Percentage;
