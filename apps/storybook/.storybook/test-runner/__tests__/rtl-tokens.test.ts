import { expect,test } from "@playwright/test";

test("Order Summary Matrix story loads under Brand X + RTL globals", async ({ page }) => {
  const base =
    "http://localhost:6007/iframe.html?id=organisms-order-summary-matrix--default";
  const response = await page.goto(`${base}&globals=tokens:brandx;locale:ar`);

  // Minimal smoke check: story responds successfully under these globals.
  expect(response && response.ok()).toBeTruthy();
});
