import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Visual regression snapshots are platform-specific.
  // CI excludes them via `--grep-invert "visual"`. Run locally with full suite.
  //
  // To generate webkit mobile baselines for gate G2, run locally:
  //   npx playwright install webkit
  //   npx playwright test --project=mobile-webkit --update-snapshots
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    // baseURL points to the server root. Tests must use '/sfm-monitor' prefix.
    // Do NOT include the subpath here — page.goto('/path') resolves against the
    // origin (ignoring baseURL subpath), so keeping baseURL at root is safest.
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    actionTimeout: 20_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    // webkit mobile — iPhone SE 3rd gen (375×667) matches gate G2 requirement.
    // Baselines are NOT committed yet. To generate them:
    //   npx playwright install webkit
    //   npx playwright test --project=mobile-webkit --update-snapshots
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone SE (3rd gen)'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    // Health-check URL must include the Astro `base` path (/sfm-monitor)
    // so Playwright detects the server as ready (bare / returns 404).
    url: 'http://localhost:4321/sfm-monitor',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
    stdout: 'pipe',
  },
});
