import { defineConfig, devices } from '@playwright/test';

// The smoke test runs against the static export in ./out, served under the same base path the
// build was made for (GitHub Pages serves the site at /<repo>/). Build first:
//   NEXT_PUBLIC_BASE_PATH=/static-gantt npm run build && npm run test:e2e
const PORT = 4173;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const BASE_URL = `http://127.0.0.1:${PORT}${BASE_PATH}/`;

export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'en-US',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // PW_CHANNEL=msedge runs the same test in an installed Edge instead of Playwright's Chromium.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, channel: process.env.PW_CHANNEL },
    },
  ],
  webServer: {
    command: `node e2e/serve.mjs out ${PORT} ${BASE_PATH}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
