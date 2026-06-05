import { expect, test } from '@playwright/test';

const BASE = '/sfm-monitor';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

const PATHS = ['/', '/mercado', '/credito', '/sofipos', '/macro'];

// Visual regression tests run in all configured projects (desktop + mobile-webkit).
// Playwright names snapshots automatically using the project name and OS, e.g.:
//   visual-spec-ts-snapshots/visual--1-desktop-linux.png
//   visual-spec-ts-snapshots/visual--1-mobile-webkit-linux.png
//
// Baselines for mobile-webkit (gate G2) are NOT committed yet.
// Generate them by running:
//   npx playwright install webkit
//   npx playwright test --project=mobile-webkit --update-snapshots
for (const path of PATHS) {
  test(`visual ${path}`, async ({ page }) => {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot({
      maxDiffPixelRatio: 0.005,
      fullPage: true,
    });
  });
}
