import { expect, type Page, test } from "playwright/test";

async function gotoStory(page: Page, url: string): Promise<void> {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#storybook-root", { timeout: 60000 });
  await page.evaluate(() => {
    const el = document.getElementById("storybook-root");
    if (el) (el as HTMLElement).style.visibility = "visible";
  });
}

test("tokens story lists base and brandx primary values", async ({ page }) => {
  // Base tokens should list primary as text in the table
  await gotoStory(page, "http://localhost:6007/iframe.html?id=tokens-all--overview");
  const baseRow = page.locator('tr', {
    has: page.locator('td', { hasText: /^--color-primary$/ }),
  });
  await expect(baseRow).toBeVisible();
  await expect(baseRow.locator('td').last()).toHaveText(/220 90% 56%/);

  // BrandX tokens via globals should list brandx primary value as text
  await gotoStory(
    page,
    "http://localhost:6007/iframe.html?id=tokens-all--overview&globals=tokens:brandx",
  );
  const brandRow = page.locator('tr', {
    has: page.locator('td', { hasText: /^--color-primary$/ }),
  });
  await expect(brandRow).toBeVisible();
  await expect(brandRow.locator('td').last()).toHaveText(/340 80% 50%/);
});
