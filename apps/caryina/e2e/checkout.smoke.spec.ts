import { expect, test } from "playwright/test";

test("@smoke checkout path renders payment form after adding product", async ({ page }) => {
  await page.goto("/en/shop", { waitUntil: "networkidle" });

  const productLinks = page.locator('a[href^="/en/product/"]');
  await expect(productLinks.first()).toBeVisible();
  await productLinks.first().click();

  await page.waitForURL(/\/en\/product\/.+/);

  const addToCart = page.getByRole("button", { name: /add to cart/i });
  await expect(addToCart).toBeVisible();
  await addToCart.click();

  await page.goto("/en/checkout", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByText("Card details")).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay now" })).toBeVisible();
});
