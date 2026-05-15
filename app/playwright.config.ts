import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  // Visual regression snapshots are platform-specific (darwin baselines).
  // CI excludes them via `--grep-invert "visual"`. Run locally with full suite.
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4321/sfm-monitor',
    trace: 'on-first-retry',
    // Disable Service Worker in E2E — prevents stale-hash CSS 404s from workbox precache
    serviceWorkers: 'block',
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
    // In CI: use 'serve' (faster startup than astro preview).
    // Locally: astro preview for full Astro runtime fidelity.
    command: process.env['CI']
      ? 'npx serve dist --listen 4321 --no-clipboard'
      : 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/sfm-monitor/',
    reuseExistingServer: !process.env['CI'],
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30_000,
  },
});
