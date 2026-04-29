// app/src/stores/onboarding.ts
import { persistentAtom } from '@nanostores/persistent';

export const $onboardingDone = persistentAtom<'true' | 'false'>(
  'sfm-onboarding-done',
  'false',
);

export const $visitCount = persistentAtom<string>('sfm-visit-count', '0');

export function bumpVisitCount(): void {
  const n = Number.parseInt($visitCount.get(), 10) || 0;
  $visitCount.set(String(n + 1));
}
