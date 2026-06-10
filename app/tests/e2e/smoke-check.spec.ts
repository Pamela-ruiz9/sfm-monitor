import { test, expect } from '@playwright/test';

const BASE = '/sfm-monitor';

test('home — carga sin errores, IMOR visible', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/sfm_home.png', fullPage: true });

  await expect(page.locator('text=IMOR Banca')).toBeVisible();
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0);
});

test('macro — salario mínimo KpiCard y chart visibles', async ({ page }) => {
  await page.goto(`${BASE}/macro`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/sfm_macro.png', fullPage: true });

  // KpiCard
  const salarioCard = page.locator('text=Salario mínimo');
  const cardCount = await salarioCard.count();
  console.log(`Salario KpiCards encontradas: ${cardCount}`);
  await expect(salarioCard.first()).toBeVisible();

  // Chart section
  const salarioSection = page.locator('#salario-minimo');
  await expect(salarioSection).toBeVisible();

  await page.screenshot({ path: '/tmp/sfm_macro_full.png', fullPage: true });
});

test('macro — KpiCard click no abre drawer', async ({ page }) => {
  await page.goto(`${BASE}/macro`);
  await page.waitForLoadState('networkidle');

  const drawerTriggers = page.locator('[data-drawer-trigger]');
  const count = await drawerTriggers.count();
  console.log(`data-drawer-trigger en macro: ${count}`);

  // If any triggers remain, clicking should not open a drawer
  if (count > 0) {
    await drawerTriggers.first().click();
    await page.waitForTimeout(600);
    const dialog = page.locator('[role="dialog"][data-state="open"]');
    await expect(dialog).toHaveCount(0);
  }
});

test('banca-multiple — chart crecimiento cartera visible', async ({ page }) => {
  await page.goto(`${BASE}/instituciones/banca-multiple`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/sfm_bm_top.png' });

  const carteraSection = page.locator('#cartera-crecimiento');
  await expect(carteraSection).toBeVisible();

  await carteraSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/sfm_bm_cartera.png' });
});
