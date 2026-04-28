import { expect, test } from '@playwright/test';

const PATHS = ['/', '/mercado', '/credito', '/sofipos', '/macro'];

for (const path of PATHS) {
  test(`visual ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot({
      maxDiffPixelRatio: 0.005,
      fullPage: true,
    });
  });
}
