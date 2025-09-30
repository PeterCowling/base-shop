import { expect, test } from "@playwright/test";

test("toolbar globals switch tokens + dark class", async ({ page }) => {
  // Base view lists base primary text
  await page.goto("http://localhost:6007/iframe.html?id=tokens-all--overview");
  const baseRow = page.locator('tr', {
    has: page.locator('td', { hasText: /^--color-primary$/ }),
  });
  await expect(baseRow).toBeVisible();
  await expect(baseRow.locator('td').last()).toHaveText(/220 90% 56%/);

  // BrandX shows brand primary text
  await page.goto(
    "http://localhost:6007/iframe.html?id=tokens-all--overview&globals=tokens:brandx",
  );
  const brandRow = page.locator('tr', {
    has: page.locator('td', { hasText: /^--color-primary$/ }),
  });
  await expect(brandRow.locator('td').last()).toHaveText(/340 80% 50%/);

  // Dark mode toggles the themes addon class on the html element (class="dark")
  await page.goto(
    "http://localhost:6007/iframe.html?id=tokens-all--overview&globals=tokens:brandx,theme:dark",
  );
  await expect
    .poll(async () =>
      page.evaluate(() =>
        document.documentElement.classList.contains("dark") ? "1" : "0",
      ),
    )
    .toBe("1");
});
