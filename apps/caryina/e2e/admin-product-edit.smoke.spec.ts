import { expect, test } from "playwright/test";

test("@smoke admin products redirects to login when session is missing/expired", async ({
  page,
}) => {
  await page.context().clearCookies();
  await page.goto("/admin/products", { waitUntil: "networkidle" });

  await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fadmin%2Fproducts$/);
  await expect(page.getByRole("heading", { name: "Admin login" })).toBeVisible();
});

test("@smoke admin login opens product edit form", async ({ page }) => {
  await page.goto("/admin/login?redirect=%2Fadmin%2Fproducts", {
    waitUntil: "networkidle",
  });

  await page.getByLabel("Admin key").fill("e2e-admin-key");
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("**/admin/products");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  const noProducts = page.getByText("No products yet.");
  if (await noProducts.isVisible().catch(() => false)) {
    return;
  }

  const firstEdit = page.getByRole("link", { name: "Edit" }).first();
  await expect(firstEdit).toBeVisible();
  await firstEdit.click();

  await page.waitForURL(/\/admin\/products\/.+/);
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /update stock/i })).toBeVisible();
});
