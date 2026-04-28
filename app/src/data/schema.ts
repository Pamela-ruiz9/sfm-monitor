import { z } from 'zod';

// ---------- primitives ----------

const IsoMonth = z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM expected');

/**
 * Loose date — accepts both ISO (YYYY-MM-DD or YYYY-MM) and DD/MM/YYYY,
 * which is what the legacy pipeline emits in many fields.
 */
const LooseDate = z.string().min(1);

const NumericString = z.union([z.string(), z.number()]).transform((v) => {
  const n = typeof v === 'string' ? Number.parseFloat(v) : v;
  if (Number.isNaN(n)) {
    throw new Error(`Cannot parse number: ${v}`);
  }
  return n;
});

// ---------- time series points ----------

const MonthlyPoint = z.object({
  mes: IsoMonth,
  valor: z.number(),
});

/**
 * Inflation points: annual variation under `var_anual` plus both
 * `fecha` (DD/MM/YYYY) and `mes` (YYYY-MM).
 */
const InflacionPoint = z.object({
  fecha: LooseDate,
  mes: IsoMonth,
  var_anual: z.number(),
});

/**
 * Rate decision points: `fecha` (DD/MM/YYYY) and `valor`.
 */
const RatePoint = z.looseObject({
  fecha: LooseDate,
  valor: z.number(),
});

// ---------- modules ----------

const FuentesSchema = z.object({
  tipo_cambio: z.string(),
  tasa_objetivo: z.string(),
  inflacion: z.string(),
});

const TipoCambioSchema = z.object({
  actual: NumericString,
  fecha: IsoMonth,
  historico_mensual: z.array(MonthlyPoint),
});

const TasaBanxicoSchema = z.object({
  actual: NumericString,
  fecha: LooseDate,
  historico: z.array(RatePoint),
});

const InflacionSchema = z.object({
  actual: NumericString,
  fecha: LooseDate,
  historico_mensual: z.array(InflacionPoint),
});

const CrisisPoint = z.looseObject({
  year: z.number(),
  mes: IsoMonth,
  label: z.string(),
  color: z.string().optional(),
});

const ImorHistoricoPoint = z.looseObject({
  fecha: IsoMonth,
  imor: z.number().nullable(),
  imora: z.number().nullable(),
  icor: z.number().nullable(),
});

const HistoricoSchema = z.object({
  tipo_cambio_desde_1994: z.array(MonthlyPoint).optional(),
  inflacion_mensual_desde_2000: z.array(InflacionPoint).optional(),
  tasa_banxico_desde_2008: z.array(RatePoint).optional(),
  crisis_mexico: z.array(CrisisPoint).optional(),
  imor_desde_2000: z.array(ImorHistoricoPoint).optional(),
});

// CNBV credit module — loose shape for now (will be tightened in v0.2.x as
// the CSV pipeline lands and stabilises the schema).
const CreditoSchema = z.looseObject({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  imor: z.unknown().optional(),
  imora: z.unknown().optional(),
  icor: z.unknown().optional(),
  roa: z.unknown().optional(),
  roe: z.unknown().optional(),
  historico_por_cartera: z.unknown().optional(),
  historico_por_banco: z.unknown().optional(),
});

const Ifrs9Schema = z.looseObject({
  ultima_actualizacion: z.string().optional(),
  fechas: z.array(z.string()).optional(),
  etapa1_pct: z.array(z.number()).optional(),
  etapa2_pct: z.array(z.number()).optional(),
  etapa3_pct: z.array(z.number()).optional(),
  ultima: z.unknown().optional(),
});

const SofiposSchema = z.looseObject({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  fechas: z.array(z.string()).optional(),
  imor_total: z.unknown().optional(),
  imor_comercial: z.unknown().optional(),
  imor_consumo: z.unknown().optional(),
  imor_vivienda: z.unknown().optional(),
  imora_total: z.unknown().optional(),
  roa: z.unknown().optional(),
  roe: z.unknown().optional(),
});

// ---------- root ----------

export const SfmDataSchema = z.object({
  ultima_actualizacion: z.string(),
  fuentes: FuentesSchema,
  tipo_cambio: TipoCambioSchema,
  tasa_banxico: TasaBanxicoSchema,
  inflacion: InflacionSchema,
  historico: HistoricoSchema,
  credito: CreditoSchema,
  ifrs9: Ifrs9Schema,
  sofipos: SofiposSchema,
});

export type SfmData = z.infer<typeof SfmDataSchema>;
export type MonthlyPointT = z.infer<typeof MonthlyPoint>;
