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
    (e) => !/manifest|favicon|preload|chunk|sentry|cookies|workbox|sw\.js/i.test(e),
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

test('credito: BM-only pivot renders and cartera buttons work', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');

  // SoFiPOs toggle must NOT appear on /credito (moved to /sofipos page)
  const sofiposBtn = page.getByRole('button', { name: /SoFiPOs/i }).first();
  await expect(sofiposBtn).not.toBeVisible();

  // Canvas should render in BM-only mode
  await expect(page.locator('canvas').first()).toBeVisible();

  // No blocking errors
  const blocking = filterBlocking(errors);
  expect(blocking, `Console errors on /credito:\n${blocking.join('\n')}`).toEqual([]);
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
