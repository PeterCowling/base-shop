import fs from "node:fs/promises";
import path from "node:path";

import { expect, test } from "playwright/test";

const REPO_ROOT = process.cwd();
const SCREENSHOT_PATH = path.join(
  REPO_ROOT,
  "docs/plans/hbag-brandmark-particle-animation/artifacts/prototype/screenshots/brandmark-final-playwright.png"
);

test("captures BrandMark final frame screenshot", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

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
