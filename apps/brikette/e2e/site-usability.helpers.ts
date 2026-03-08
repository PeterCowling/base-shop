import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

export const BRIKETTE_LIVE_ROUTES = {
  home: "/en",
  help: "/en/help",
  transport: "/en/how-to-get-here",
  privacy: "/en/privacy-policy",
  bookDormBed: "/en/book-dorm-bed",
  naplesAirportGuide: "/en/how-to-get-here/naples-airport-positano-bus",
} as const;

export type PageErrorTracker = {
  readonly messages: string[];
};

export const createPageErrorTracker = (page: Page): PageErrorTracker => {
  const messages: string[] = [];
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });
  return { messages };
};

export const expectNoPageErrors = (tracker: PageErrorTracker): void => {
  expect(tracker.messages).toEqual([]);
};

export const gotoAndExpectReady = async (page: Page, pathname: string): Promise<void> => {
  const response = await page.goto(pathname, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `Expected ${pathname} to return HTTP 200`).toBe(200);
  await expect(page.locator("main")).toBeVisible();
};

export const clickAndExpectUrl = async (
  page: Page,
  locator: Locator,
  urlPattern: RegExp,
): Promise<void> => {
  await locator.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(urlPattern),
    locator.click(),
  ]);
};

export const firstVisibleLink = (page: Page, name: RegExp | string): Locator =>
  page.getByRole("link", { name }).first();

export const firstVisibleButton = (page: Page, name: RegExp | string): Locator =>
  page.getByRole("button", { name }).first();

export const isMobileProject = (testInfo: TestInfo): boolean =>
  Boolean((testInfo.project.use as { isMobile?: boolean }).isMobile);
