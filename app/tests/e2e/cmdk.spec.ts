import { expect, test } from '@playwright/test';

const BASE = '/sfm-monitor';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

test('clicking ⌘K trigger opens palette and search returns results', async ({ page }) => {
  await page.goto(`${BASE}/`);
  // Wait for the page to be idle so client:idle components (CmdKPalette) are mounted
  await page.waitForLoadState('networkidle');
  // Dismiss any driver.js overlay that may still appear by pressing Escape
  await page.keyboard.press('Escape');
  // Use the visible button trigger from the header (works cross-viewport)
  // Force-click bypasses pointer-intercept checks so driver.js overlay doesn't block
  await page.locator('[data-cmdk-trigger]').first().click({ force: true });
  // cmdk renders the input with cmdk-input attribute after the dialog opens
  const input = page.locator('input[cmdk-input]');
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill('fx');
  await expect(page.locator('[cmdk-list]')).toContainText(/Tipo de cambio|FX/i);
});

test('Cmd+K keyboard shortcut opens palette', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Webkit modifier handling differs');
  await page.goto(`${BASE}/`);
  // Wait for the page to be idle so client:idle components (CmdKPalette) are mounted
  await page.waitForLoadState('networkidle');
  // Focus body first to ensure keyboard listener catches the event
  await page.locator('body').click({ force: true });
  await page.keyboard.press('Meta+k');
  // Fallback to Control+k if Meta+k didn't fire
  if (!(await page.locator('input[cmdk-input]').isVisible().catch(() => false))) {
    await page.keyboard.press('Control+k');
  }
  await expect(page.locator('input[cmdk-input]')).toBeVisible({ timeout: 5000 });
});
