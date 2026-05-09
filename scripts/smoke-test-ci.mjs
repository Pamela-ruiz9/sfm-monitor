#!/usr/bin/env node
/**
 * smoke-test-ci.mjs
 *
 * Verifies that every script path referenced in .github/workflows/*.yml
 * actually exists in the repository. Catches "path drift" bugs like the one
 * fixed in PR #13 (validate-schema.mjs → validate-data.ts) *before* they
 * reach CI.
 *
 * Also checks:
 *   - working-directory entries point to real directories
 *   - cache-dependency-path entries exist
 *
 * Usage:
 *   node scripts/smoke-test-ci.mjs
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = resolve(__dir, '..');

// ── helpers ────────────────────────────────────────────────────────────────

const ok   = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => { console.error(`  ❌ ${msg}`); failures++; };
let failures = 0;

function exists(relPath) {
  return existsSync(resolve(ROOT, relPath));
}

// ── load workflows ─────────────────────────────────────────────────────────

const workflowDir = resolve(ROOT, '.github/workflows');
const workflowFiles = readdirSync(workflowDir)
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map((f) => ({ name: f, path: resolve(workflowDir, f) }));

console.log(`\n🔍 Smoke-testing ${workflowFiles.length} workflow(s) in .github/workflows/\n`);

// ── checks ─────────────────────────────────────────────────────────────────

for (const { name, path } of workflowFiles) {
  const src = readFileSync(path, 'utf-8');
  const lines = src.split('\n');

  console.log(`📄 ${name}`);

  // 1. Script paths in `run:` lines  ─────────────────────────────────────
  //    Matches patterns like:
  //      node --experimental-strip-types app/scripts/foo.ts
  //      node --experimental-strip-types scripts/foo.mjs
  //      python3 scripts/normalize-cnbv.py
  const scriptRefRe = /(?:node(?:\s+--[^\s]+)*|python3)\s+((?:app\/|scripts\/)[^\s'"]+)/g;

  for (const line of lines) {
    let m;
    while ((m = scriptRefRe.exec(line)) !== null) {
      const scriptPath = m[1];
      if (exists(scriptPath)) {
        ok(`${scriptPath} exists`);
      } else {
        fail(`${scriptPath} referenced in ${name} but NOT FOUND in repo`);
      }
    }
  }

  // 2. cache-dependency-path  ────────────────────────────────────────────
  const cachePaths = [...src.matchAll(/cache-dependency-path:\s*(.+)/g)].map(m => m[1].trim());
  for (const p of cachePaths) {
    if (exists(p)) {
      ok(`cache-dependency-path ${p} exists`);
    } else {
      fail(`cache-dependency-path ${p} in ${name} NOT FOUND`);
    }
  }

  // 3. working-directory  ────────────────────────────────────────────────
  const wdPaths = [...src.matchAll(/working-directory:\s*(.+)/g)].map(m => m[1].trim());
  for (const p of wdPaths) {
    if (exists(p)) {
      ok(`working-directory ${p} exists`);
    } else {
      fail(`working-directory ${p} in ${name} NOT FOUND`);
    }
  }

  // 4. upload-artifact paths — skip build-time outputs (dist/, reports/)
  //    Only check paths that look like static source files with extensions.
  const artifactPaths = [...src.matchAll(/^\s+path:\s+(.+)/gm)]
    .map(m => m[1].trim())
    .filter(p =>
      !p.startsWith('${{') &&
      !p.includes('*') &&
      !p.includes('dist') &&
      !p.includes('report') &&
      !p.includes('cache') &&
      /\.[a-z]+$/.test(p) // only explicit files (e.g. lockfile), not generated dirs
    );
  for (const p of artifactPaths) {
    if (exists(p)) {
      ok(`artifact path ${p} exists`);
    } else {
      fail(`artifact path ${p} in ${name} NOT FOUND`);
    }
  }

  console.log();
}

// ── summary ────────────────────────────────────────────────────────────────

if (failures === 0) {
  console.log('✅ All CI smoke checks passed.\n');
  process.exit(0);
} else {
  console.error(`❌ ${failures} check(s) failed. Fix paths before merging.\n`);
  process.exit(1);
}
