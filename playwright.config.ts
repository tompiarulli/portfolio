import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// Smoke tests against the production build, served as Cloudflare serves it
// (scripts/serve-prod.mjs). Build it first with `pnpm build`.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm serve:prod',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
})
