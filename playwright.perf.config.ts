import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Performance benchmarks run against a production build (`next build && next start`)
 * so measurements reflect shipped performance rather than dev-mode compile/HMR overhead.
 * Run via `npm run test:perf`.
 */
export default defineConfig({
  testDir: "./tests/performance",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}/manage/welcome`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { E2E_TEST_MODE: "1" },
  },
});
