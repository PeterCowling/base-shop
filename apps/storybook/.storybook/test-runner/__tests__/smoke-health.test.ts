import { test, expect } from "@playwright/test";

test("health story iframe bootstraps", async ({ page }) => {
  const url = "http://localhost:6007/iframe.html?id=health-smoke--ok";
  const res = await page.goto(url);
  expect(res?.ok()).toBeTruthy();
  const root = page.locator("#storybook-root");
  await expect(root).toHaveCount(1);
});
