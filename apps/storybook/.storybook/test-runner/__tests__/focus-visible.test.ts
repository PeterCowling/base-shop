import { expect, test } from "playwright/test";

const BASE_URL = process.env.STORYBOOK_BASE_URL ?? "http://localhost:6007";
const STORY_ID = "foundation-focus-rings--overview";

test("focus ring is visible in forced-colors mode", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(`${BASE_URL}/iframe.html?id=${STORY_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#storybook-root", { timeout: 60000 });
  await page.evaluate(() => {
    const el = document.getElementById("storybook-root");
    if (el) (el as HTMLElement).style.visibility = "visible";
  });
  const firstFocusable = page.getByRole("button", { name: "Focusable button" });
  await expect(firstFocusable).toBeVisible();

  await page.keyboard.press("Tab");
  const focusState = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) {
      return null;
    }

    const style = window.getComputedStyle(el);
    return {
      matchesFocusVisible: el.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });

  expect(focusState).not.toBeNull();
  if (!focusState) return;

  expect(focusState.matchesFocusVisible).toBe(true);
  const hasOutline = focusState.outlineStyle !== "none" && focusState.outlineWidth !== "0px";
  const hasRingShadow = Boolean(focusState.boxShadow) && focusState.boxShadow !== "none";
  expect(hasOutline || hasRingShadow).toBe(true);
});
