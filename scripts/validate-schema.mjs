/**
 * validate-schema.mjs
 * Validates data/sfm-data.json against the Zod schema defined in app/src/data/schema.ts.
 * Exits 0 if valid, 1 if invalid (with detailed error output).
 *
 * Usage: node scripts/validate-schema.mjs [--file path/to/sfm-data.json]
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Parse args
const fileArgIdx = process.argv.indexOf('--file');
const dataPath = fileArgIdx !== -1
  ? resolve(process.argv[fileArgIdx + 1])
  : resolve(__dir, '../data/sfm-data.json');

// Dynamic import of the Zod schema (compiled via tsx/ts-node in CI)
const { SfmDataSchema } = await import('../app/src/data/schema.ts');

let raw;
try {
  raw = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch (e) {
  console.error(`❌ Cannot read or parse ${dataPath}:\n  ${e.message}`);
  process.exit(1);
}

const result = SfmDataSchema.safeParse(raw);

if (result.success) {
  const d = result.data;
  console.log(`✅ Schema valid`);
  console.log(`   FX:        ${d.tipo_cambio.actual} (${d.tipo_cambio.fecha})`);
  console.log(`   Tasa:      ${d.tasa_banxico.actual}% (${d.tasa_banxico.fecha})`);
  console.log(`   Inflación: ${d.inflacion.actual}% (${d.inflacion.fecha})`);
  process.exit(0);
} else {
  console.error(`❌ Schema validation failed: ${result.error.issues.length} issue(s)`);
  for (const issue of result.error.issues) {
    console.error(`   [${issue.path.join('.')}] ${issue.message}`);
  }
  process.exit(1);
}
