import { test, expect } from "@playwright/test";

test("Order Summary Matrix respects tokens + RTL", async ({ page }) => {
  // Default story id derives from title + export: organisms-order-summary-matrix--default
  const base = "http://localhost:6007/iframe.html?id=organisms-order-summary-matrix--default";
  await page.goto(`${base}&globals=tokens:brandx;locale:ar`);

  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveClass(/theme-brandx/);
});
