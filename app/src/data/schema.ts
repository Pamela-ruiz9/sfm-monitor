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

const KpiSnapshot = z.object({
  actual: z.number(),
  fecha: z.string(),
  semaforo: z.enum(['verde', 'amarillo', 'rojo']).optional(),
});

const HistoricoCarteraSchema = z.object({
  fechas: z.array(z.string()),
  imor_total: z.array(z.number()),
  imor_comercial: z.array(z.number()),
  imor_consumo: z.array(z.number()),
  imor_vivienda: z.array(z.number()),
  imor_tarjeta: z.array(z.number()),
  imor_consumo_norev: z.array(z.number()),
  imora_total: z.array(z.number().nullable()),
  icor_total: z.array(z.number()),
  roa: z.array(z.number().nullable()),
  roe: z.array(z.number().nullable()),
});

const HistoricoBancoEntrySchema = z.object({
  nombre: z.string(),
  id: z.string(),
  imor_total: z.array(z.number().nullable()),
});

const HistoricoBancoCarteraEntrySchema = z.looseObject({
  nombre: z.string(),
  id: z.string(),
  imor_total: z.array(z.number().nullable()),
  imor_comercial: z.array(z.number().nullable()).optional(),
  imor_consumo: z.array(z.number().nullable()).optional(),
  imor_vivienda: z.array(z.number().nullable()).optional(),
  imor_tarjeta: z.array(z.number().nullable()).optional(),
  imor_latest: z.unknown().optional(),
});

const HistoricoBancoSchema = z.object({
  fechas: z.array(z.string()),
  bancos: z.record(z.string(), HistoricoBancoEntrySchema),
  bancos_x_cartera: z.record(z.string(), HistoricoBancoCarteraEntrySchema).optional(),
});

const CreditoSchema = z.object({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  imor: KpiSnapshot,
  imora: KpiSnapshot,
  icor: KpiSnapshot,
  roa: KpiSnapshot,
  roe: KpiSnapshot,
  historico_por_cartera: HistoricoCarteraSchema,
  historico_por_banco: HistoricoBancoSchema.optional(),
});

const Ifrs9UltimaSchema = z.object({
  fecha: z.string(),
  etapa1: z.number(),
  etapa2: z.number(),
  etapa3: z.number(),
});

const Ifrs9Schema = z.object({
  ultima_actualizacion: z.string().optional(),
  fechas: z.array(z.string()),
  etapa1_pct: z.array(z.number()),
  etapa2_pct: z.array(z.number()),
  etapa3_pct: z.array(z.number()),
  ultima: Ifrs9UltimaSchema.optional(),
});

const SofiposEntidadSchema = z.looseObject({
  nombre: z.string(),
  id: z.string(),
  imor: z.array(z.number().nullable()),
});

const SofiposHistoricoEntidadSchema = z.object({
  fechas: z.array(z.string()),
  entidades: z.record(z.string(), SofiposEntidadSchema),
});

const SofiposUltimaSchema = z.object({
  fecha: z.string(),
  imor_total: z.number(),
  imor_comercial: z.number(),
  imor_consumo: z.number(),
  imor_vivienda: z.number(),
  imora_total: z.number(),
  roa: z.number(),
  roe: z.number(),
});

const SofiposSchema = z.object({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  fechas: z.array(z.string()),
  imor_total: z.array(z.number()),
  imor_comercial: z.array(z.number()),
  imor_consumo: z.array(z.number()),
  imor_vivienda: z.array(z.number()),
  imora_total: z.array(z.number().nullable()),
  roa: z.array(z.number().nullable()),
  roe: z.array(z.number().nullable()),
  ultima: SofiposUltimaSchema.optional(),
  historico_por_entidad: SofiposHistoricoEntidadSchema.optional(),
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
