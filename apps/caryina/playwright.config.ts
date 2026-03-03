/* eslint-disable ds/no-hardcoded-copy -- CARY-TESTS-001 [ttl=2027-03-01] Playwright config literals are test infrastructure, not UI copy. */
import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3318",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm --filter @apps/caryina exec next dev --webpack -p 3318",
    url: "http://127.0.0.1:3318",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
      CARYINA_ADMIN_KEY: "e2e-admin-key",
    },
  },
});
