import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

// ─── Helper ────────────────────────────────────────────────────────────────
// NOTE: call BEFORE page.goto() to capture load-time errors
function watchErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

function filterBlocking(errors: string[]): string[] {
  return errors.filter(
    (e) => !/manifest|favicon|preload|chunk|sentry|cookies/i.test(e),
  );
}

// ─── /credito charts ────────────────────────────────────────────────────────
test('credito: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  const blocking = filterBlocking(errors);
  expect(blocking, `Console errors on /credito:\n${blocking.join('\n')}`).toEqual([]);
});

test('credito: ImoraChart canvas renders', async ({ page }) => {
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
});

test('credito: IcorChart canvas renders', async ({ page }) => {
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  // At least two canvas elements should be present (multiple charts on /credito)
  const canvases = page.locator('canvas');
  await expect(canvases.first()).toBeVisible();
  const count = await canvases.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

test('credito: ImorSegPivotChart pivot responds to SoFiPOs button click', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');

  // Click the SoFiPOs sector button
  const sofiposBtn = page.getByRole('button', { name: /SoFiPOs/i }).first();
  await expect(sofiposBtn).toBeVisible();
  await sofiposBtn.click();

  // After click there should be no new blocking errors
  await page.waitForTimeout(300);
  const blocking = filterBlocking(errors);
  expect(blocking, `Console errors after SoFiPOs click:\n${blocking.join('\n')}`).toEqual([]);

  // Canvas should still be rendered after pivot
  await expect(page.locator('canvas').first()).toBeVisible();
});

// ─── /sofipos charts ─────────────────────────────────────────────────────────
test('sofipos: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/sofipos');
  await page.waitForLoadState('networkidle');
  const blocking = filterBlocking(errors);
  expect(blocking, `Console errors on /sofipos:\n${blocking.join('\n')}`).toEqual([]);
});

test('sofipos: at least one canvas renders', async ({ page }) => {
  await page.goto('/sofipos');
  await page.waitForLoadState('networkidle');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
});

// ─── /riesgo heatmap ────────────────────────────────────────────────────────
test('riesgo: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/riesgo');
  await page.waitForLoadState('networkidle');
  const blocking = filterBlocking(errors);
  expect(blocking, `Console errors on /riesgo:\n${blocking.join('\n')}`).toEqual([]);
});

test('riesgo: heatmap canvas renders', async ({ page }) => {
  await page.goto('/riesgo');
  await page.waitForLoadState('networkidle');
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
});
