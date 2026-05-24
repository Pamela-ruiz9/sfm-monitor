import { expect, test } from '@playwright/test';

// Set localStorage flag to skip the onboarding tour BEFORE the page loads.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

test('clicking FX KPI opens drawer with FX content', async ({ page }) => {
  await page.goto('.');
  await page.locator('[data-drawer-trigger="fx"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[role="dialog"]')).toContainText(/Tipo de cambio|MXN/i);
});

test('drawer can be closed with Escape', async ({ page }) => {
  await page.goto('.');
  await page.locator('[data-drawer-trigger="fx"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
});

test('deep link ?indicator=fx opens drawer on load', async ({ page }) => {
  await page.goto('.?indicator=fx');
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
});
