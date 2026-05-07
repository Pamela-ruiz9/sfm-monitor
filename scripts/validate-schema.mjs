/**
 * validate-schema.mjs
 * Validates data/ JSONs against the Zod schemas in app/src/data/schema.ts.
 *
 * Validates:
 *   data/sfm-data.json  → TipoCambioSchema + TasaBanxicoSchema + InflacionSchema (Banxico fields)
 *   data/credito.json   → CreditoSchema  (when present)
 *   data/sofipos.json   → SofiposSchema  (when present)
 *
 * Usage:
 *   node --experimental-strip-types scripts/validate-schema.mjs
 *   node --experimental-strip-types scripts/validate-schema.mjs --file data/credito.json
 *
 * Requires Node 22+ (--experimental-strip-types).
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');

// ── Import schemas ────────────────────────────────────────────────────────────
const {
  SfmDataSchema,
  // We re-export sub-schemas from schema.ts via named exports (added below)
} = await import('../app/src/data/schema.ts');

// Partial schema for sfm-data.json (Banxico-only fields — credito/sofipos/historico
// live in separate files and are merged at runtime by the loader)
const BanxicoFileSchema = z.object({
  ultima_actualizacion: z.string(),
  fuentes: z.object({
    tipo_cambio:   z.string(),
    tasa_objetivo: z.string(),
    inflacion:     z.string(),
  }),
  tipo_cambio: z.object({
    actual: z.union([z.string(), z.number()]),
    fecha:  z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'YYYY-MM or YYYY-MM-DD expected'),
    historico_mensual: z.array(z.object({
      mes:   z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM expected'),
      valor: z.number(),
    })),
  }),
  tasa_banxico: z.object({
    actual: z.union([z.string(), z.number()]),
    fecha:  z.string().min(1),
    historico: z.array(z.object({
      fecha: z.string().min(1),
      valor: z.union([z.string(), z.number()]),
    })),
  }),
  inflacion: z.object({
    actual: z.union([z.string(), z.number()]).nullable(),
    fecha:  z.string().nullable(),
    historico_mensual: z.array(z.object({
      mes:      z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM expected'),
      fecha:    z.string(),
      valor:    z.number(),
    })),
  }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    return { error: e.message };
  }
}

function validate(label, schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, label };
  }
  return { ok: false, label, issues: result.error.issues };
}

function printResult({ ok, label, issues }) {
  if (ok) {
    console.log(`✅ ${label}`);
    return true;
  }
  console.error(`❌ ${label} — ${issues.length} issue(s):`);
  for (const i of issues.slice(0, 20)) {
    const path = i.path.length ? `[${i.path.join('.')}]` : '[root]';
    console.error(`   ${path} ${i.message}`);
  }
  if (issues.length > 20) console.error(`   ... (${issues.length - 20} more)`);
  return false;
}

// ── Single-file mode ──────────────────────────────────────────────────────────

const fileArgIdx = process.argv.indexOf('--file');
if (fileArgIdx !== -1) {
  const path = resolve(process.argv[fileArgIdx + 1]);
  const data = loadJson(path);
  if (data.error) { console.error(`❌ Cannot read ${path}: ${data.error}`); process.exit(1); }

  const name = path.split('/').pop();
  let schema;
  if (name === 'sfm-data.json')  schema = BanxicoFileSchema;
  else if (name === 'credito.json')  schema = SfmDataSchema.shape.credito;
  else if (name === 'sofipos.json')  schema = SfmDataSchema.shape.sofipos;
  else { console.error(`Unknown file: ${name}. Supported: sfm-data.json, credito.json, sofipos.json`); process.exit(1); }

  const ok = printResult(validate(name, schema, data));
  process.exit(ok ? 0 : 1);
}

// ── Full validate mode ────────────────────────────────────────────────────────

let allOk = true;

// 1. sfm-data.json (always required)
const sfmPath = resolve(ROOT, 'data/sfm-data.json');
if (!existsSync(sfmPath)) {
  console.error('❌ data/sfm-data.json not found');
  process.exit(1);
}
const sfmData = loadJson(sfmPath);
if (sfmData.error) { console.error(`❌ Cannot read sfm-data.json: ${sfmData.error}`); process.exit(1); }
allOk = printResult(validate('data/sfm-data.json', BanxicoFileSchema, sfmData)) && allOk;
if (allOk) {
  const d = sfmData;
  console.log(`   FX ${d.tipo_cambio.actual} (${d.tipo_cambio.fecha})  ` +
              `Tasa ${d.tasa_banxico.actual}%  Inflación ${d.inflacion.actual}%`);
}

// 2. credito.json (optional — only if present)
const creditoPath = resolve(ROOT, 'data/credito.json');
if (existsSync(creditoPath)) {
  const creditoData = loadJson(creditoPath);
  if (creditoData.error) { console.error(`❌ Cannot read credito.json: ${creditoData.error}`); allOk = false; }
  else {
    const ok = printResult(validate('data/credito.json', SfmDataSchema.shape.credito, creditoData));
    allOk = ok && allOk;
    if (ok) {
      console.log(`   IMOR ${creditoData.imor?.actual} (${creditoData.ultima_actualizacion})  ` +
                  `${creditoData.historico_por_cartera?.fechas?.length ?? 0} periodos`);
    }
  }
}

// 3. sofipos.json (optional — only if present)
const sofiposPath = resolve(ROOT, 'data/sofipos.json');
if (existsSync(sofiposPath)) {
  const sofiposData = loadJson(sofiposPath);
  if (sofiposData.error) { console.error(`❌ Cannot read sofipos.json: ${sofiposData.error}`); allOk = false; }
  else {
    const ok = printResult(validate('data/sofipos.json', SfmDataSchema.shape.sofipos, sofiposData));
    allOk = ok && allOk;
    if (ok) {
      console.log(`   IMOR ${sofiposData.ultima?.imor_total} (${sofiposData.ultima_actualizacion})  ` +
                  `${sofiposData.fechas?.length ?? 0} periodos  ${Object.keys(sofiposData.historico_por_entidad?.entidades ?? {}).length} instituciones`);
    }
  }
}

process.exit(allOk ? 0 : 1);
