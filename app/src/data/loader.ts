import rawData from '../../../data/sfm-data.json';
import { SfmDataSchema, type SfmData } from './schema';

/**
 * Build-time loader: parses & validates `data/sfm-data.json` exactly once.
 * Throws at build time if the schema doesn't match — fail loud, fail early.
 *
 * The JSON lives at the repo root so it's shared with the legacy `index.html`
 * during migration. Both consumers read from the same source of truth.
 */
let cached: SfmData | null = null;

export function loadSfmData(): SfmData {
  if (cached) return cached;
  const parsed = SfmDataSchema.safeParse(rawData);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 10)
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `sfm-data.json failed schema validation:\n${issues}\n` +
        `(${parsed.error.issues.length} total issues)`,
    );
  }
  cached = parsed.data;
  return cached;
}
