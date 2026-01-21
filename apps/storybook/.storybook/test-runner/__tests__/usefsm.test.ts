import { expect,test } from "@playwright/test";

test("useFSM toggles button label", async ({ page }) => {
  await page.goto(
    "http://localhost:6007/iframe.html?id=hooks-usefsm--toggle-example",
  );
  const button = page.locator("#storybook-root button").first();
  await expect(button).toBeVisible();
  await expect(button).toHaveText(/Turn On|Turn Off/);

  const initial = await button.textContent();
  await button.click();
  await expect(button).not.toHaveText(initial ?? "");
});
