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
 * Inflation points: annual % variation.
 * Pipeline emits {mes: YYYY-MM, fecha: YYYY-MM-DD, valor: number} after PR #5 normalization.
 */
const InflacionPoint = z.object({
  fecha: LooseDate,
  mes: IsoMonth,
  valor: z.number(),
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
  // Pipeline emits YYYY-MM-DD (exact date of last FX reading)
  fecha: LooseDate,
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
  imora_total: z.array(z.number().nullable()).optional(),
  icor_total: z.array(z.number().nullable()).optional(),
  imor_latest: z.number().nullable().optional(),
  imora_latest: z.number().nullable().optional(),
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

// ---------- macro (IGAE, PIB, desempleo — Banxico SIE / INEGI) ----------

const MacroPuntoMensualSchema = z.object({
  fecha: z.string(),
  valor: z.number(),
});

const MacroPuntoTrimestralSchema = z.object({
  fecha: z.string(), // YYYY-QN e.g. "2026-Q1"
  valor: z.number(),
});

const MacroSchema = z.object({
  igae: z.object({
    actual: z.number().nullable(),
    fecha: z.string().nullable(),
    variacion_anual: z.number().nullable().optional(),
    historico: z.array(MacroPuntoMensualSchema).optional(),
  }).optional(),
  pib: z.object({
    actual: z.number().nullable(),
    fecha: z.string().nullable(),
    variacion_anual: z.number().nullable().optional(),
    historico: z.array(MacroPuntoTrimestralSchema).optional(),
  }).optional(),
  desempleo: z.object({
    actual: z.number().nullable(),
    fecha: z.string().nullable(),
    historico: z.array(MacroPuntoTrimestralSchema).optional(),
  }).optional(),
});

// ---------- capitalizacion y liquidez (CNBV — descarga manual) ----------

const CapitalizacionBancoSchema = z.object({
  nombre: z.string(),
  icap_latest: z.number().nullable(),
  cet1_latest: z.number().nullable().optional(),
  historico: z.array(z.number().nullable()).optional(),
});

const CapitalizacionSchema = z.object({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  icap_sistema: KpiSnapshot,
  cet1_sistema: KpiSnapshot.optional(),
  historico: z.array(z.object({
    fecha: z.string(),
    icap: z.number(),
    cet1: z.number().nullable(),
  })),
  por_banco: z.record(z.string(), CapitalizacionBancoSchema).optional(),
});

const LiquidezSchema = z.object({
  ultima_actualizacion: z.string().optional(),
  fuente: z.string().optional(),
  lcr_sistema: KpiSnapshot,
  nsfr_sistema: KpiSnapshot.optional(),
  historico: z.array(z.object({
    fecha: z.string(),
    lcr: z.number(),
    nsfr: z.number().nullable(),
  })),
});

// ---------- mercado (Banxico series: reservas, TIIE Fondeo, Cetes, UDIs, salario mínimo) ----------

const MercadoSerieSchema = z.object({
  actual: z.number().nullable(),
  fecha: z.string().nullable(),
  historico: z.array(z.object({ fecha: z.string(), valor: z.number() })).optional(),
});

const MercadoSchema = z.object({
  reservas_internacionales: MercadoSerieSchema.optional(),
  tiie_fondeo: MercadoSerieSchema.optional(),
  cetes_28d: MercadoSerieSchema.optional(),
  udis: z.object({ actual: z.number().nullable(), fecha: z.string().nullable() }).optional(),
  salario_minimo: MercadoSerieSchema.optional(),
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
  mercado: MercadoSchema.optional(),
  macro: MacroSchema.optional(),
  capitalizacion: CapitalizacionSchema.optional(),
  liquidez: LiquidezSchema.optional(),
});

export type SfmData = z.infer<typeof SfmDataSchema>;
export type MonthlyPointT = z.infer<typeof MonthlyPoint>;
