// apps/brikette/playwright.config.ts
// Playwright configuration for Brikette E2E tests.
// Tests require the Worker build (not the static export) to access /api/availability.
// Run against a locally-running Worker dev server: `wrangler dev` or `next dev`.
/* eslint-disable ds/no-hardcoded-copy -- BRIK-1 [ttl=2027-02-27] Playwright config identifiers are test infrastructure, not UI copy. */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
