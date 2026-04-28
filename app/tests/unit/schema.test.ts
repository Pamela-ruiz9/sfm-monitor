import { describe, expect, it } from 'vitest';
import { SfmDataSchema } from '~/data/schema';
import sfmData from '../../../data/sfm-data.json';

describe('SfmDataSchema', () => {
  it('validates real production data successfully', () => {
    const result = SfmDataSchema.safeParse(sfmData);
    if (!result.success) {
      console.error(result.error.issues.slice(0, 5));
    }
    expect(result.success).toBe(true);
  });
});
