import { expect, test } from '@playwright/test';

test('Cmd+K opens palette and search returns results', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Webkit modifier handling differs');
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  // Fallback to Control+k if Meta+k didn't fire
  if (!(await page.locator('[cmdk-input]').isVisible().catch(() => false))) {
    await page.keyboard.press('Control+k');
  }
  await expect(page.locator('[cmdk-input]')).toBeVisible({ timeout: 5000 });
  await page.locator('[cmdk-input]').fill('fx');
  await expect(page.locator('[cmdk-list]')).toContainText(/Tipo de cambio|FX/i);
});
