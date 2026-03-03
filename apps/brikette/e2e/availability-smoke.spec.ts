// apps/brikette/e2e/availability-smoke.spec.ts
// Smoke test for the live availability feature on the book page.
// Requires: Worker build running at PLAYWRIGHT_BASE_URL (default: http://localhost:3000).
// NEXT_PUBLIC_OCTORATE_LIVE_AVAILABILITY must be set to 1 at build time.
//
// TC-07-01: Navigation to /en/book succeeds.
// TC-07-02: After entering dates, at least one RoomCard shows a price value.
// TC-07-03: Clicking NR CTA triggers navigation to book.octorate.com/octobook/site/reservation/result.xhtml.

import { expect, test } from "@playwright/test";

// Use a date range in the future that is valid for Octobook (at least 1 night).
const CHECKIN = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
})();

const CHECKOUT = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 32);
  return d.toISOString().slice(0, 10);
})();

test.describe("Availability smoke test", () => {
  // TC-07-01: Page loads without JS errors
  test("TC-07-01: /en/book loads without console errors", async ({ page }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    const response = await page.goto("/en/book");
    expect(response?.status()).toBe(200);

    // Allow time for React hydration
    await page.waitForLoadState("networkidle");

    expect(jsErrors).toHaveLength(0);
  });

  // TC-07-02: After entering valid dates, at least one room shows a price
  test("TC-07-02: entering valid dates shows price on at least one room card", async ({ page }) => {
    await page.goto(`/en/book?checkin=${CHECKIN}&checkout=${CHECKOUT}&pax=1`);
    await page.waitForLoadState("networkidle");

    // Wait for at least one room price to appear (loading skeleton should resolve)
    // Room prices are shown as text matching "From €XX.XX" or similar.
    // The test waits up to the default timeout (30s) for the price to appear.
    await expect(
      page.locator("text=/From €\\d+/").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  // TC-07-03: Clicking the NR CTA triggers navigation to book.octorate.com
  test("TC-07-03: clicking NR CTA navigates to book.octorate.com", async ({ page }) => {
    // Intercept all requests to book.octorate.com and abort them (prevents actual redirect in CI).
    let octorateNavigationUrl = "";

    await page.route("**book.octorate.com**", (route) => {
      octorateNavigationUrl = route.request().url();
      // Abort to prevent leaving the page in tests
      void route.abort();
    });

    await page.goto(`/en/book?checkin=${CHECKIN}&checkout=${CHECKOUT}&pax=1`);
    await page.waitForLoadState("networkidle");

    // Wait for a room price to appear before clicking
    await page.locator("text=/From €\\d+/").first().waitFor({ timeout: 15_000 });

    // Click the first visible NR CTA button
    // Room card CTA buttons: look for buttons containing Non-Refundable or Book Now variants
    const nrButton = page
      .locator("button, a")
      .filter({ hasText: /non.refundable|reserve now|book now|rates/i })
      .first();

    await nrButton.click();

    // Wait briefly for navigation attempt
    await page.waitForTimeout(1000);

    expect(octorateNavigationUrl).toContain("book.octorate.com");
    expect(octorateNavigationUrl).toContain("octobook/site/reservation/result.xhtml");
  });
});
