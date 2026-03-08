import { expect, test } from "@playwright/test";

import {
  BRIKETTE_LIVE_ROUTES,
  clickAndExpectUrl,
  createPageErrorTracker,
  expectNoPageErrors,
  firstVisibleButton,
  firstVisibleLink,
  gotoAndExpectReady,
  isMobileProject,
} from "./site-usability.helpers";

test.describe("Brikette live usability smoke", () => {
  test("TC-UX-01: homepage CTA routes guests to book-dorm-bed", async ({ page }) => {
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.home);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await clickAndExpectUrl(
      page,
      firstVisibleLink(page, /^Check availability$/),
      /\/en\/book-dorm-bed$/,
    );

    await expect(page).toHaveURL(/\/en\/book-dorm-bed$/);
    await expect(page.locator("main")).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("TC-UX-02: desktop primary navigation reaches key hub pages", async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo), "Desktop nav smoke only.");
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.home);
    await clickAndExpectUrl(page, firstVisibleLink(page, /^Help$/), /\/en\/help$/);
    await expect(page).toHaveURL(/\/en\/help$/);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.home);
    await clickAndExpectUrl(page, firstVisibleLink(page, /^How to Get Here$/), /\/en\/how-to-get-here$/);
    await expect(page).toHaveURL(/\/en\/how-to-get-here$/);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.home);
    await clickAndExpectUrl(page, firstVisibleLink(page, /^Deals$/), /\/en\/deals$/);
    await expect(page).toHaveURL(/\/en\/deals$/);

    expectNoPageErrors(pageErrors);
  });

  test("TC-UX-03: help hub legal footer links stay navigable", async ({ page }) => {
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.help);
    await clickAndExpectUrl(
      page,
      firstVisibleLink(page, /^Privacy policy$/),
      /\/en\/privacy-policy$/,
    );

    await expect(page).toHaveURL(/\/en\/privacy-policy$/);
    await expect(page.locator("main")).toBeVisible();
    expectNoPageErrors(pageErrors);
  });

  test("TC-UX-04: transport filters dialog opens, updates the URL, and closes", async ({ page }) => {
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.transport);

    await firstVisibleButton(page, /^Edit filters$/).click();
    const filtersDialog = page.locator('[role="dialog"][data-state="open"]').first();
    await expect(filtersDialog).toBeVisible();
    await expect(filtersDialog.getByRole("heading", { name: /^Filter routes$/ })).toBeVisible();

    await filtersDialog.getByRole("button", { name: /^Naples Airport$/ }).click();
    await expect(page).toHaveURL(/(?:\?|&)place=/);

    await filtersDialog.getByRole("button", { name: /^Done$/ }).click();
    await expect(filtersDialog).toBeHidden();
    expectNoPageErrors(pageErrors);
  });

  test("TC-UX-05: transport guide lightbox opens and closes", async ({ page }) => {
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.transport);

    await firstVisibleButton(page, /^Open image:/).click();
    const lightboxDialog = page.locator('[role="dialog"][data-state="open"]').first();
    await expect(lightboxDialog).toBeVisible();

    await lightboxDialog.getByRole("button", { name: /^Close$/ }).click();
    await expect(lightboxDialog).toBeHidden();
    expectNoPageErrors(pageErrors);
  });

  test("TC-UX-06: transport hub route cards open the expected guide", async ({ page }) => {
    const pageErrors = createPageErrorTracker(page);

    await gotoAndExpectReady(page, BRIKETTE_LIVE_ROUTES.transport);
    await clickAndExpectUrl(
      page,
      firstVisibleLink(page, /Naples Airport to Positano by Bus/i),
      /\/en\/how-to-get-here\/naples-airport-positano-bus$/,
    );

    await expect(page).toHaveURL(/\/en\/how-to-get-here\/naples-airport-positano-bus$/);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    expectNoPageErrors(pageErrors);
  });
});
