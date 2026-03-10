#!/usr/bin/env node

import process from "node:process";
import {
  assertNoPageErrors,
  clickAndExpectUrl,
  createPageErrorTracker,
  gotoAndExpectReady,
  runSmokeSuite,
} from "./live-smoke-harness.mjs";

const ROUTES = {
  home: "/en",
  help: "/en/help",
  privacy: "/en/privacy-policy",
  transport: "/en/how-to-get-here",
  bookDormBed: "/en/book-dorm-bed",
  naplesAirportGuide: "/en/how-to-get-here/naples-airport-positano-bus",
};

const TEST_CASES = [
  {
    id: "TC-UX-01",
    name: "homepage CTA routes guests to book-dorm-bed",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.home);
      await page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible" });
      await clickAndExpectUrl(
        page,
        page.getByRole("link", { name: /^Check availability$/ }).first(),
        /\/en\/book-dorm-bed$/,
      );
      await page.locator("main").first().waitFor({ state: "visible" });

      assertNoPageErrors(pageErrors, "Homepage CTA");
    },
  },
  {
    id: "TC-UX-02",
    name: "desktop navigation reaches Help, How to Get Here, and Deals",
    run: async ({ page, project }) => {
      if (project.isMobile) {
        return { skipped: "Desktop nav coverage only." };
      }

      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.home);
      await clickAndExpectUrl(page, page.getByRole("link", { name: /^Help$/ }).first(), /\/en\/help$/);

      await gotoAndExpectReady(page, ROUTES.home);
      await clickAndExpectUrl(
        page,
        page.getByRole("link", { name: /^How to Get Here$/ }).first(),
        /\/en\/how-to-get-here$/,
      );

      await gotoAndExpectReady(page, ROUTES.home);
      await clickAndExpectUrl(page, page.getByRole("link", { name: /^Deals$/ }).first(), /\/en\/deals$/);

      assertNoPageErrors(pageErrors, "Desktop navigation");
      return { skipped: false };
    },
  },
  {
    id: "TC-UX-03",
    name: "help footer privacy policy link navigates correctly",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.help);
      await clickAndExpectUrl(
        page,
        page.getByRole("link", { name: /^Privacy policy$/ }).first(),
        /\/en\/privacy-policy$/,
      );
      await page.locator("main").first().waitFor({ state: "visible" });

      assertNoPageErrors(pageErrors, "Help privacy navigation");
    },
  },
  {
    id: "TC-UX-04",
    name: "transport image lightbox opens and closes",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.transport);
      await page.getByRole("button", { name: /^Open image:/ }).first().click();

      const closeButton = page.getByRole("button", { name: /^Close$/ }).last();
      await closeButton.waitFor({ state: "visible" });
      await closeButton.click();
      await closeButton.waitFor({ state: "hidden" });

      assertNoPageErrors(pageErrors, "Transport lightbox");
    },
  },
  {
    id: "TC-UX-05",
    name: "transport guide card opens the Naples Airport guide",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.transport);
      await clickAndExpectUrl(
        page,
        page.getByRole("link", { name: /Naples Airport to Positano by Bus/i }).first(),
        /\/en\/how-to-get-here\/naples-airport-positano-bus$/,
      );
      await page.getByRole("heading", { level: 1 }).first().waitFor({ state: "visible" });

      assertNoPageErrors(pageErrors, "Naples Airport guide navigation");
    },
  },
];

runSmokeSuite({
  suiteId: "brikette-live-usability",
  suiteName: "Brikette live usability smoke",
  tests: TEST_CASES,
}).catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
