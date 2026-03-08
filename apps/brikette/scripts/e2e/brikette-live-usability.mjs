#!/usr/bin/env node

import process from "node:process";

import { chromium, devices, firefox, webkit } from "playwright";

const DEFAULT_BASE_URL = "https://hostel-positano.com";
const DEFAULT_PROJECT_SET = "chromium";

const ROUTES = {
  home: "/en",
  help: "/en/help",
  privacy: "/en/privacy-policy",
  transport: "/en/how-to-get-here",
  bookDormBed: "/en/book-dorm-bed",
  naplesAirportGuide: "/en/how-to-get-here/naples-airport-positano-bus",
};

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildProjectMatrix(projectSet) {
  switch (projectSet) {
    case "chromium":
      return [
        {
          name: "chromium",
          browserType: chromium,
          contextOptions: { ...devices["Desktop Chrome"] },
          isMobile: false,
        },
      ];
    case "cross-browser":
      return [
        {
          name: "chromium",
          browserType: chromium,
          contextOptions: { ...devices["Desktop Chrome"] },
          isMobile: false,
        },
        {
          name: "firefox",
          browserType: firefox,
          contextOptions: { ...devices["Desktop Firefox"] },
          isMobile: false,
        },
        {
          name: "webkit",
          browserType: webkit,
          contextOptions: { ...devices["Desktop Safari"] },
          isMobile: false,
        },
        {
          name: "mobile-chrome",
          browserType: chromium,
          contextOptions: { ...devices["Pixel 7"] },
          isMobile: true,
        },
        {
          name: "mobile-safari",
          browserType: webkit,
          contextOptions: { ...devices["iPhone 13"] },
          isMobile: true,
        },
      ];
    default:
      throw new Error(
        `Unsupported BRIKETTE_PLAYWRIGHT_PROJECT_SET="${projectSet}". Expected "chromium" or "cross-browser".`,
      );
  }
}

function createPageErrorTracker(page) {
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  return pageErrors;
}

function assertNoPageErrors(pageErrors, contextLabel) {
  assert(pageErrors.length === 0, `${contextLabel} emitted page errors:\n- ${pageErrors.join("\n- ")}`);
}

async function gotoAndExpectReady(page, pathname) {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
  assert(response?.status() === 200, `Expected ${pathname} to return HTTP 200, received ${response?.status()}`);
  await page.locator("main").first().waitFor({ state: "visible" });
}

async function clickAndExpectUrl(page, locator, urlPattern) {
  await locator.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL((url) => urlPattern.test(url.toString())),
    locator.click(),
  ]);
}

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

async function runProject(project, baseUrl) {
  const browser = await project.browserType.launch({ headless: true });
  const results = [];

  try {
    for (const testCase of TEST_CASES) {
      const context = await browser.newContext({
        ...project.contextOptions,
        baseURL: baseUrl,
      });
      const page = await context.newPage();
      const startedAt = Date.now();

      try {
        const outcome = await testCase.run({ page, project });
        const durationMs = Date.now() - startedAt;

        if (outcome?.skipped) {
          console.info(`SKIP [${project.name}] ${testCase.id} ${testCase.name} (${outcome.skipped})`);
          results.push({ project: project.name, id: testCase.id, status: "skipped", durationMs });
        } else {
          console.info(`PASS [${project.name}] ${testCase.id} ${testCase.name} (${durationMs}ms)`);
          results.push({ project: project.name, id: testCase.id, status: "passed", durationMs });
        }
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        const message = error instanceof Error ? error.message : String(error);
        console.error(`FAIL [${project.name}] ${testCase.id} ${testCase.name} (${durationMs}ms)`);
        console.error(message);
        results.push({ project: project.name, id: testCase.id, status: "failed", durationMs, message });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL);
  const projectSet = process.env.BRIKETTE_PLAYWRIGHT_PROJECT_SET ?? DEFAULT_PROJECT_SET;
  const projects = buildProjectMatrix(projectSet);

  console.info(`Running Brikette live usability smoke against ${baseUrl}`);
  console.info(`Project set: ${projectSet}`);

  const results = [];
  for (const project of projects) {
    console.info(`\n== ${project.name} ==`);
    results.push(...(await runProject(project, baseUrl)));
  }

  const passed = results.filter((result) => result.status === "passed").length;
  const skipped = results.filter((result) => result.status === "skipped").length;
  const failed = results.filter((result) => result.status === "failed");

  console.info("\nSummary");
  console.info(`Passed: ${passed}`);
  console.info(`Skipped: ${skipped}`);
  console.info(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    for (const failure of failed) {
      console.error(`- [${failure.project}] ${failure.id}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
