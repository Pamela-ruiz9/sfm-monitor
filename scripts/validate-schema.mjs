#!/usr/bin/env node
// scripts/validate-schema.mjs
// Valida data/sfm-data.json contra SfmDataSchema (Zod)
// Uso: node scripts/validate-schema.mjs [path/to/sfm-data.json]
// Exit 0 = válido, Exit 1 = inválido (imprime errores)

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = process.argv[2] ?? resolve(__dirname, "../data/sfm-data.json");

// Importar el schema compilado desde app/src/data/schema.ts
// En CI se usa tsx para ejecutar TypeScript directamente
const { SfmDataSchema } = await import("../app/src/data/schema.ts");

let raw;
try {
  raw = JSON.parse(readFileSync(dataPath, "utf8"));
} catch (e) {
  console.error(`❌ No se pudo leer el archivo: ${dataPath}`);
  console.error(e.message);
  process.exit(1);
}

const result = SfmDataSchema.safeParse(raw);

if (result.success) {
  console.log(`✅ sfm-data.json válido`);
  console.log(`   ultima_actualizacion: ${result.data.ultima_actualizacion}`);
  console.log(`   tipo_cambio: ${result.data.tipo_cambio.actual} (${result.data.tipo_cambio.fecha})`);
  console.log(`   tasa_banxico: ${result.data.tasa_banxico.actual}% (${result.data.tasa_banxico.fecha})`);
  console.log(`   inflacion: ${result.data.inflacion.actual}% (${result.data.inflacion.fecha})`);
  process.exit(0);
} else {
  console.error(`❌ sfm-data.json inválido — ${result.error.errors.length} error(es):`);
  for (const err of result.error.errors) {
    console.error(`   [${err.path.join(".")}] ${err.message}`);
  }
  process.exit(1);
}
