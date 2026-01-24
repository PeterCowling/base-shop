import { expect, test } from "playwright/test";

const BASE_URL = process.env.STORYBOOK_BASE_URL ?? "http://localhost:6007";
const STORY_ID = "compositions-homepage--default";

const variants = [
  { name: "base-light", globals: "tokens:base;theme:light" },
  { name: "base-dark", globals: "tokens:base;theme:dark" },
  { name: "brandx-light", globals: "tokens:brandx;theme:light" },
  { name: "brandx-dark", globals: "tokens:brandx;theme:dark" },
];

test.describe("visual regression: themes/modes", () => {
  for (const variant of variants) {
    test(variant.name, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`${BASE_URL}/iframe.html?id=${STORY_ID}&globals=${variant.globals}`);
      const root = page.locator("#storybook-root");
      await page.evaluate(() => {
        const el = document.getElementById("storybook-root");
        if (el) (el as HTMLElement).style.visibility = "visible";
      });
      await expect(root).toBeVisible({ timeout: 15000 });
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
      });
      await page.waitForTimeout(500);
      await expect(root).toHaveScreenshot(`homepage-${variant.name}.png`, {
        animations: "disabled",
      });
    });
  }
});
