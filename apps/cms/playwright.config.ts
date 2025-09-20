import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const CMS_PORT = Number(process.env.CMS_PORT ?? 3006);
const CMS_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${CMS_PORT}`;
const STORAGE_STATE = path.join(__dirname, "tests/e2e/.auth/admin.json");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: CMS_BASE_URL,
    storageState: STORAGE_STATE,
    trace: process.env.CI ? "retain-on-failure" : "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `pnpm run dev`,
    cwd: __dirname,
    url: CMS_BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
