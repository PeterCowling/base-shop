import { expect, test } from "playwright/test";

const SMOKE_PRODUCT_ID = "01KCS72C6YV3PFWJQNF0A4T1P1";

async function seedCartFromFirstProduct(page: import("playwright/test").Page) {
  await page.goto("/en/checkout", { waitUntil: "networkidle" });
  const payload = (await page.evaluate(async (productId) => {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: { id: productId },
        qty: 1,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      ok: response.ok,
      body,
    };
  }, SMOKE_PRODUCT_ID)) as {
    ok: boolean;
    body?: {
      ok?: boolean;
      cart?: Record<string, unknown>;
    };
  };
  expect(payload.ok).toBeTruthy();
  expect(payload.body?.ok).toBeTruthy();
  expect(Object.keys(payload.body?.cart ?? {})).not.toHaveLength(0);
}

async function fillCardForm(page: import("playwright/test").Page) {
  await page.getByLabel(/card number/i).fill("4111111111111111");
  await page.getByLabel(/expiry month/i).fill("12");
  await page.getByLabel(/expiry year/i).fill("2027");
  await page.getByLabel(/^cvv/i).fill("123");
}

test("@smoke checkout path renders payment form after adding product", async ({ page }) => {
  await seedCartFromFirstProduct(page);

  await page.goto("/en/checkout", { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await expect(page.getByLabel(/card number/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay now" })).toBeVisible();
});

test("@smoke checkout decline keeps user on checkout and shows error", async ({ page }) => {
  await seedCartFromFirstProduct(page);
  await page.goto("/en/checkout", { waitUntil: "networkidle" });

  await page.route("**/api/checkout-session", async (route) => {
    await route.fulfill({
      status: 402,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: "Card declined" }),
    });
  });

  await fillCardForm(page);
  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page).toHaveURL(/\/en\/checkout$/);
  await expect(page.locator("p[role='alert']")).toHaveText("Card declined");
});

test("@smoke checkout inventory conflict shows recovery error", async ({ page }) => {
  await seedCartFromFirstProduct(page);
  await page.goto("/en/checkout", { waitUntil: "networkidle" });

  await page.route("**/api/checkout-session", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: "Insufficient stock",
        code: "inventory_insufficient",
      }),
    });
  });

  await fillCardForm(page);
  await page.getByRole("button", { name: "Pay now" }).click();

  await expect(page).toHaveURL(/\/en\/checkout$/);
  await expect(page.locator("p[role='alert']")).toHaveText("Insufficient stock");
});

test("@smoke checkout success transitions to success page and cancelled links are valid", async ({ page }) => {
  await seedCartFromFirstProduct(page);
  await page.goto("/en/checkout", { waitUntil: "networkidle" });

  await page.route("**/api/checkout-session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        transactionId: "txn-e2e-001",
        amount: 4500,
        currency: "eur",
      }),
    });
  });

  await fillCardForm(page);
  await page.getByRole("button", { name: "Pay now" }).click();

  await page.waitForURL(/\/en\/success$/);
  await expect(page.getByRole("heading", { name: "Order confirmed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue shopping" })).toHaveAttribute(
    "href",
    "/en/shop",
  );

  await page.goto("/en/cancelled", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Payment cancelled" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to cart" })).toHaveAttribute(
    "href",
    "/en/cart",
  );
  await expect(page.getByRole("link", { name: "Back to shop" })).toHaveAttribute(
    "href",
    "/en/shop",
  );
});
