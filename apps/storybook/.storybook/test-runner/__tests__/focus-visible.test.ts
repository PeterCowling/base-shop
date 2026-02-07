import { expect, test } from "playwright/test";

const BASE_URL = process.env.STORYBOOK_BASE_URL ?? "http://localhost:6007";
const STORY_ID = "foundation-focus-rings--overview";

test("focus ring is visible in forced-colors mode", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(`${BASE_URL}/iframe.html?id=${STORY_ID}`);
  await page.evaluate(() => {
    const el = document.getElementById("storybook-root");
    if (el) (el as HTMLElement).style.visibility = "visible";
  });

  await page.keyboard.press("Tab");
  const outlineStyle = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "";
    const style = window.getComputedStyle(el);
    return `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`;
  });

  expect(outlineStyle).not.toMatch(/^none\b/i);
  expect(outlineStyle).toMatch(/CanvasText/i);
});
