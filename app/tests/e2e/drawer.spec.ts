import { expect, test } from '@playwright/test';

const BASE = '/sfm-monitor';
// Página con KpiCards que abren el drawer al hacer click.
// (En la home, index.astro intercepta el click de #kpi-grid para cambiar la
// gráfica inline en vez de abrir el drawer — ver test dedicado abajo.)
const DRAWER_PAGE = `${BASE}/instituciones/banca-multiple`;

// Set localStorage flag to skip the onboarding tour BEFORE the page loads.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

test('clicking IMOR KPI opens drawer with IMOR content', async ({ page }) => {
  test.slow(); // DRAWER_PAGE pesa >9 MB de HTML
  await page.goto(DRAWER_PAGE);
  // ChartDrawer es client:idle: espera a que hidrate antes de hacer click
  await page.waitForLoadState('networkidle');
  await page.locator('[data-drawer-trigger="imor"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[role="dialog"]')).toContainText(/IMOR Banca Múltiple/i);
});

test('drawer can be closed with Escape', async ({ page }) => {
  test.slow(); // DRAWER_PAGE pesa >9 MB de HTML
  await page.goto(DRAWER_PAGE);
  await page.waitForLoadState('networkidle');
  await page.locator('[data-drawer-trigger="imor"]').first().click();
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
});

test('deep link ?indicator=fx opens drawer on load', async ({ page }) => {
  await page.goto(`${BASE}/?indicator=fx`);
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
});

test('home: clicking a KPI selects the inline chart instead of opening the drawer', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.locator('#kpi-grid [data-drawer-trigger="tasa"]').first().click();
  await expect(page).toHaveURL(/\?indicator=tasa$/);
  await expect(page.locator('#kpi-grid [data-drawer-trigger="tasa"]')).toHaveAttribute('data-kpi-active', 'true');
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});
