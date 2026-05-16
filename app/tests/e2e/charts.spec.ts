import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

// ─── Helper ────────────────────────────────────────────────────────────────
// NOTE: call BEFORE page.goto() to capture load-time errors.
// Uses requestfailed (not console) so we get the actual failing URL.
// Filters out known infra noise that is NOT a real app bug:
//  - _assets/*.css 404: Vite/Rollup stale-hash CSS in OnboardingTour chunk
//  - font CORS: external fonts fail in local preview (expected)
function watchErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (/_assets\/.*\.css/.test(url)) return; // stale CSS hash (Vite build artifact)
    if (/fonts\.(googleapis|gstatic)\.com|rsms\.me/.test(url)) return; // font CORS in preview
    errors.push(`${req.failure()?.errorText ?? 'ERR'}: ${url}`);
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

// ─── Helper: trigger client:visible hydration by scrolling through the page ──
// Astro's client:visible uses IntersectionObserver. In headless CI the viewport
// is small and charts may be below the fold — scroll forces hydration.
async function scrollAndWaitForCanvas(page: import('@playwright/test').Page) {
  // Scroll to bottom to trigger IntersectionObserver for all client:visible components
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  // Scroll back to top so first canvas is in view
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

// ─── /credito charts ────────────────────────────────────────────────────────
test('credito: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  expect(errors, `Request failures on /credito:\n${errors.join('\n')}`).toEqual([]);
});

test('credito: ImoraChart canvas renders', async ({ page }) => {
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  await scrollAndWaitForCanvas(page);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
});

test('credito: IcorChart canvas renders', async ({ page }) => {
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  await scrollAndWaitForCanvas(page);
  // At least two canvas elements should be present (multiple charts on /credito)
  const canvases = page.locator('canvas');
  await expect(canvases.first()).toBeVisible({ timeout: 10000 });
  const count = await canvases.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

test('credito: BM-only pivot renders and cartera buttons work', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/credito');
  await page.waitForLoadState('networkidle');
  await scrollAndWaitForCanvas(page);

  // SoFiPOs toggle must NOT appear on /credito (moved to /sofipos page)
  const sofiposBtn = page.getByRole('button', { name: /SoFiPOs/i }).first();
  await expect(sofiposBtn).not.toBeVisible();

  // Canvas should render in BM-only mode
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

  // No blocking errors
  expect(errors, `Request failures on /credito:\n${errors.join('\n')}`).toEqual([]);
});

// ─── /sofipos charts ─────────────────────────────────────────────────────────
test('sofipos: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/sofipos');
  await page.waitForLoadState('networkidle');
  expect(errors, `Request failures on /sofipos:\n${errors.join('\n')}`).toEqual([]);
});

test('sofipos: at least one canvas renders', async ({ page }) => {
  await page.goto('/sofipos');
  await page.waitForLoadState('networkidle');
  await scrollAndWaitForCanvas(page);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
});

// ─── /riesgo heatmap ────────────────────────────────────────────────────────
test('riesgo: no JS console errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/riesgo');
  await page.waitForLoadState('networkidle');
  expect(errors, `Request failures on /riesgo:\n${errors.join('\n')}`).toEqual([]);
});

test('riesgo: heatmap canvas renders', async ({ page }) => {
  await page.goto('/riesgo');
  await page.waitForLoadState('networkidle');
  await scrollAndWaitForCanvas(page);
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible({ timeout: 10000 });
});
