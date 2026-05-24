import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Visual regression snapshots are platform-specific (darwin baselines).
  // CI excludes them via `--grep-invert "visual"`. Run locally with full suite.
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
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
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
