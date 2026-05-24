import { expect, test } from '@playwright/test';

const BASE = '/sfm-monitor';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('sfm-onboarding-done', 'true');
  });
});

// NOTE: Playwright resolves page.goto('/path') against the server origin.
// Since the Astro base is /sfm-monitor, all paths must include that prefix.
// We use the BASE constant so it's easy to change if the deploy path changes.
const TABS = [
  { path: `${BASE}/`, heading: /Resumen ejecutivo|SFM Monitor|sistema|Riesgo/i },
  { path: `${BASE}/mercado`, heading: /MXN\/USD|Tasa objetivo|Mercado/i },
  { path: `${BASE}/credito`, heading: /Crédito|Banca/i },
  { path: `${BASE}/sofipos`, heading: /SoFiPOs/i },
  { path: `${BASE}/macro`, heading: /INPC|Inflación|Macro/i },
  { path: `${BASE}/riesgo`, heading: /Riesgo|heatmap|sistémico/i },
  { path: `${BASE}/metodologia`, heading: /Metodología|umbrales|fuentes/i },
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
