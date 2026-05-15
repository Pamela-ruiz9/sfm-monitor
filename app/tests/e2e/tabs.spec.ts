import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

const TABS = [
  { path: '/', heading: /Resumen ejecutivo|SFM Monitor|sistema|Riesgo/i },
  { path: '/mercado', heading: /MXN\/USD|Tasa objetivo|Mercado/i },
  { path: '/credito', heading: /Crédito|Banca/i },
  { path: '/sofipos', heading: /SoFiPOs/i },
  { path: '/macro', heading: /INPC|Inflación|Macro/i },
  { path: '/riesgo', heading: /Riesgo|heatmap|sistémico/i },
  { path: '/metodologia', heading: /Metodología|umbrales|fuentes/i },
];

for (const { path, heading } of TABS) {
  test(`tab ${path} loads with heading`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`${msg.text()}`);
      }
    });
    await page.goto(path);
    await expect(page.locator('body')).toContainText(heading);
    // Filter out expected errors (manifest 404 placeholder, font preload, etc.)
    const blocking = errors.filter(
      (e) =>
        !/manifest|favicon|preload|chunk|sentry|cookies|workbox|sw\.js/i.test(e),
    );
    expect(blocking, `Console errors on ${path}:\n${blocking.join('\n')}`).toEqual([]);
  });
}
