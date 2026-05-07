/**
 * validate-data.ts
 * Validates data/ JSONs against the Zod schemas in src/data/schema.ts.
 *
 * Validates:
 *   ../data/sfm-data.json  → Banxico fields (tipo_cambio, tasa_banxico, inflacion)
 *   ../data/credito.json   → CreditoSchema  (when present)
 *   ../data/sofipos.json   → SofiposSchema  (when present)
 *
 * Usage (run from app/ directory):
 *   node --experimental-strip-types scripts/validate-data.ts
 *   node --experimental-strip-types scripts/validate-data.ts --file ../data/credito.json
 *
 * Requires Node 22+.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { SfmDataSchema } from '../src/data/schema.ts';

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dir, '../../data');

// ── Partial schema for sfm-data.json (Banxico-only fields) ───────────────────
// credito / sofipos / historico / ifrs9 live in separate files.
const BanxicoFileSchema = z.object({
  ultima_actualizacion: z.string(),
  fuentes: z.object({
    tipo_cambio:   z.string(),
    tasa_objetivo: z.string(),
    inflacion:     z.string(),
  }),
  tipo_cambio: z.object({
    actual: z.union([z.string(), z.number()]),
    // Accept both YYYY-MM and YYYY-MM-DD (bot writes YYYY-MM-DD, schema prefers YYYY-MM)
    fecha: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'YYYY-MM or YYYY-MM-DD expected'),
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
      mes:   z.string().regex(/^\d{4}-\d{2}$/, 'YYYY-MM expected'),
      fecha: z.string(),
      valor: z.number(),
    })),
  }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadJson(path: string): { data?: unknown; error?: string } {
  try {
    return { data: JSON.parse(readFileSync(path, 'utf-8')) };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

function validate(label: string, schema: z.ZodTypeAny, data: unknown): boolean {
  const result = schema.safeParse(data);
  if (result.success) {
    console.log(`✅ ${label}`);
    return true;
  }
  const issues = result.error.issues;
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
  const path = resolve(process.argv[fileArgIdx + 1]!);
  const { data, error } = loadJson(path);
  if (error) { console.error(`❌ Cannot read ${path}: ${error}`); process.exit(1); }

  const name = path.split('/').pop()!;
  let schema: z.ZodTypeAny;
  if (name === 'sfm-data.json')  schema = BanxicoFileSchema;
  else if (name === 'credito.json')  schema = SfmDataSchema.shape.credito;
  else if (name === 'sofipos.json')  schema = SfmDataSchema.shape.sofipos;
  else {
    console.error(`Unknown file: ${name}. Supported: sfm-data.json, credito.json, sofipos.json`);
    process.exit(1);
  }
  process.exit(validate(name, schema, data) ? 0 : 1);
}

// ── Full validate mode ────────────────────────────────────────────────────────

let allOk = true;

// 1. sfm-data.json (always required)
const sfmPath = resolve(DATA_DIR, 'sfm-data.json');
if (!existsSync(sfmPath)) {
  console.error('❌ data/sfm-data.json not found');
  process.exit(1);
}
const { data: sfmRaw, error: sfmErr } = loadJson(sfmPath);
if (sfmErr) { console.error(`❌ sfm-data.json: ${sfmErr}`); process.exit(1); }
allOk = validate('data/sfm-data.json', BanxicoFileSchema, sfmRaw) && allOk;
if (allOk) {
  const d = sfmRaw as ReturnType<typeof BanxicoFileSchema.parse>;
  console.log(`   FX ${d.tipo_cambio.actual} (${d.tipo_cambio.fecha})` +
              `  Tasa ${d.tasa_banxico.actual}%  Inflación ${d.inflacion.actual}%`);
}

// 2. credito.json (optional)
const creditoPath = resolve(DATA_DIR, 'credito.json');
if (existsSync(creditoPath)) {
  const { data, error } = loadJson(creditoPath);
  if (error) { console.error(`❌ credito.json: ${error}`); allOk = false; }
  else {
    const ok = validate('data/credito.json', SfmDataSchema.shape.credito, data);
    allOk = ok && allOk;
    if (ok) {
      const d = data as Record<string, unknown>;
      const hpc = d['historico_por_cartera'] as Record<string, unknown[]>;
      console.log(`   IMOR ${(d['imor'] as Record<string,unknown>)?.['actual']} ` +
                  `(${d['ultima_actualizacion']})  ${hpc?.['fechas']?.length ?? 0} periodos`);
    }
  }
}

// 3. sofipos.json (optional)
const sofiposPath = resolve(DATA_DIR, 'sofipos.json');
if (existsSync(sofiposPath)) {
  const { data, error } = loadJson(sofiposPath);
  if (error) { console.error(`❌ sofipos.json: ${error}`); allOk = false; }
  else {
    const ok = validate('data/sofipos.json', SfmDataSchema.shape.sofipos, data);
    allOk = ok && allOk;
    if (ok) {
      const d = data as Record<string, unknown>;
      const ult = d['ultima'] as Record<string, unknown>;
      const ents = (d['historico_por_entidad'] as Record<string, unknown>)?.['entidades'];
      console.log(`   IMOR ${ult?.['imor_total']} (${d['ultima_actualizacion']})` +
                  `  ${(d['fechas'] as unknown[])?.length ?? 0} periodos` +
                  `  ${Object.keys(ents as object ?? {}).length} instituciones`);
    }
  }
}

if (!allOk) {
  console.error('\nFix the issues above before merging to main.');
}

process.exit(allOk ? 0 : 1);
