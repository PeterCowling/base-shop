import { test, expect } from "@playwright/test";

test("Order Summary Matrix renders under Brand X + RTL globals without error", async ({ page }) => {
  const base =
    "http://localhost:6007/iframe.html?id=organisms-order-summary-matrix--default";
  await page.goto(`${base}&globals=tokens:brandx;locale:ar`);

  // Smoke-check that the OrderSummary table rendered and basic labels are present.
  const table = page.locator("table");
  await expect(table).toBeVisible();
  await expect(page.getByText("Subtotal")).toBeVisible();
  await expect(page.getByText("Total")).toBeVisible();
});
