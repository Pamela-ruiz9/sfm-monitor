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
    // requestfailed gives us the actual URL — console.error doesn't.
    // Filter known infra noise (not real app bugs):
    //  - _assets/*.css 404: Vite/Rollup stale-hash bug in OnboardingTour chunk
    //  - font CORS: external fonts fail in local preview
    const errors: string[] = [];
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (/_assets\/.*\.css/.test(url)) return;
      if (/fonts\.(googleapis|gstatic)\.com|rsms\.me/.test(url)) return;
      errors.push(`${req.failure()?.errorText ?? 'ERR'}: ${url}`);
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(path);
    await expect(page.locator('body')).toContainText(heading);
    expect(errors, `Request failures on ${path}:\n${errors.join('\n')}`).toEqual([]);
  });
}
