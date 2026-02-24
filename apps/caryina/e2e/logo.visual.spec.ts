import { type ChildProcessWithoutNullStreams,spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { expect, test } from "playwright/test";

const REPO_ROOT = process.cwd();
const BASE_URL = "http://127.0.0.1:3318";
const SCREENSHOT_PATH = path.join(
  REPO_ROOT,
  "docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/screenshots/brandmark-final-playwright.png"
);

let devServer: ChildProcessWithoutNullStreams | null = null;

async function serverIsReady(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { redirect: "manual" });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await serverIsReady()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for Caryina dev server at ${BASE_URL}`);
}

test.beforeAll(async () => {
  devServer = spawn(
    "pnpm",
    [
      "--filter",
      "@apps/caryina",
      "exec",
      "next",
      "dev",
      "--webpack",
      "-p",
      "3318",
    ],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: "pipe",
    }
  );

  await waitForServer(180_000);
});

test.afterAll(async () => {
  if (!devServer) {
    return;
  }

  devServer.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    if (!devServer) {
      resolve();
      return;
    }

    devServer.once("exit", () => resolve());
    setTimeout(() => resolve(), 10_000);
  });
});

test("captures BrandMark final frame screenshot", async ({ page }) => {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const brandmark = page.locator('[role="img"][aria-label="Carina"]').first();
  await expect(brandmark).toBeVisible();
  await expect(brandmark).toHaveAttribute("data-particle-state", /done/, {
    timeout: 8_000,
  });

  await fs.mkdir(path.dirname(SCREENSHOT_PATH), { recursive: true });
  await brandmark.screenshot({
    path: SCREENSHOT_PATH,
    animations: "disabled",
  });

  const stats = await fs.stat(SCREENSHOT_PATH);
  expect(stats.size).toBeGreaterThan(2000);
});
