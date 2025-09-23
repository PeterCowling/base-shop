import { test, expect } from "@playwright/test";

function futureDateTime(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60_000).toISOString().slice(0, 16);
}

test.describe("Email marketing", () => {
  test("queues a scheduled campaign from the composer", async ({ page }) => {
    const subject = `Automation smoke ${Date.now()}`;
    const scheduleAt = futureDateTime(90);

    await test.step("open the marketing composer", async () => {
      await page.goto("/cms/marketing/email");
      await expect(page.getByRole("heading", { name: "Compose campaign" })).toBeVisible();
    });

    await test.step("populate mandatory fields", async () => {
      await page.getByLabel("Shop").fill("segshop");
      await page.getByLabel("Recipients").fill("customer@example.com");
      await page.getByLabel("Subject").fill(subject);
      await page.getByLabel("HTML body").fill("<p>Automation smoke test</p>");
      await page.getByLabel("Send at").fill(scheduleAt);
      await expect(page.getByRole("heading", { name: subject })).toBeVisible();
    });

    await test.step("queue the campaign", async () => {
      await page.getByRole("button", { name: "Queue campaign" }).click();
      await expect(page.getByRole("status")).toContainText("Campaign queued for delivery.");
    });

    await test.step("confirm UI resets and history records the campaign", async () => {
      await expect(page.getByLabel("Subject")).toHaveValue("");
      await expect(page.getByRole("cell", { name: subject })).toBeVisible();
    });
  });
});
