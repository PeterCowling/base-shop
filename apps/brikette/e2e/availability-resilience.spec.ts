import { expect, test } from "@playwright/test";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const CHECKIN = isoDaysFromNow(30);
const CHECKOUT = isoDaysFromNow(32);

const SOLD_OUT_FIXTURE = {
  rooms: [
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ].map((roomId) => ({
    octorateRoomId: roomId,
    octorateRoomName: `room_${roomId}`,
    available: false,
    priceFrom: null,
    nights: 2,
    ratePlans: [],
  })),
  fetchedAt: new Date().toISOString(),
};

test.describe("Availability resilience", () => {
  test("shows sold-out state when availability API marks all rooms unavailable", async ({ page }) => {
    await page.route("**/api/availability**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SOLD_OUT_FIXTURE),
      });
    });

    await page.goto(`/en/book?checkin=${CHECKIN}&checkout=${CHECKOUT}&pax=1`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("text=/sold out/i").first()).toBeVisible({ timeout: 15_000 });
  });

  test("keeps CTA handoff navigable when /api/availability returns 500", async ({ page }) => {
    let octorateNavigationUrl = "";

    await page.route("**book.octorate.com**", async (route) => {
      octorateNavigationUrl = route.request().url();
      await route.abort();
    });

    await page.route("**/api/availability**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "upstream unavailable" }),
      });
    });

    await page.goto(`/en/book?checkin=${CHECKIN}&checkout=${CHECKOUT}&pax=1`);
    await page.waitForLoadState("networkidle");

    const cta = page
      .locator("button, a")
      .filter({ hasText: /non.refundable|reserve now|book now|rates/i })
      .first();

    await cta.click();
    await page.waitForTimeout(1000);

    expect(octorateNavigationUrl).toContain("book.octorate.com");
    expect(octorateNavigationUrl).toContain("octobook/site/reservation/result.xhtml");
  });

  test("runs homepage widget -> /book -> room CTA -> octorate handoff", async ({ page }) => {
    let octorateNavigationUrl = "";

    await page.route("**book.octorate.com**", async (route) => {
      octorateNavigationUrl = route.request().url();
      await route.abort();
    });

    await page.goto("/en");
    await page.waitForLoadState("networkidle");

    const bookingSection = page.locator("section#booking");
    const dateInputs = bookingSection.locator("input[type=date]");

    await dateInputs.nth(0).fill(CHECKIN);
    await dateInputs.nth(1).fill(CHECKOUT);

    await bookingSection.getByRole("button", { name: /check availability/i }).click();

    await expect(page).toHaveURL(/\/en\/book\?/);
    await page.waitForLoadState("networkidle");

    const cta = page
      .locator("button, a")
      .filter({ hasText: /non.refundable|reserve now|book now|rates/i })
      .first();

    await cta.click();
    await page.waitForTimeout(1000);

    expect(octorateNavigationUrl).toContain("book.octorate.com");
    expect(octorateNavigationUrl).toContain("octobook/site/reservation/result.xhtml");
  });
});
