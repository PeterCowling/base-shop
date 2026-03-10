#!/usr/bin/env node

import {
  assert,
  assertNoPageErrors,
  clickAndExpectUrl,
  createPageErrorTracker,
  gotoAndExpectReady,
  runSmokeSuite,
} from "./live-smoke-harness.mjs";

const ROUTES = {
  home: "/en",
  bookDormBed: "/en/book-dorm-bed",
  privateBooking: "/en/book-private-accommodations",
  dormRoomDetail: "/en/dorms/room_10",
};

const SEARCH = {
  checkin: "2026-10-19",
  checkout: "2026-10-21",
  pax: 2,
};

function buildSearchQuery(search = SEARCH) {
  return new URLSearchParams({
    checkin: search.checkin,
    checkout: search.checkout,
    pax: String(search.pax),
  }).toString();
}

async function setHiddenDateInput(page, input, value) {
  await input.evaluate((node, nextValue) => {
    if (!(node instanceof HTMLInputElement)) return;
    node.value = nextValue;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);

  const selector = await input.evaluate((node) => {
    if (!(node instanceof HTMLElement)) return "";
    const testId = node.getAttribute("data-testid");
    return testId ? `[data-testid="${testId}"]` : "";
  });

  await page.waitForFunction(
    ({ selector, expected }) => {
      const element = document.querySelector(selector);
      return element instanceof HTMLInputElement && element.value === expected;
    },
    {
      selector,
      expected: value,
    },
  );
}

async function findFirstEnabledButton(page, namePattern) {
  const buttons = page.getByRole("button", { name: namePattern });
  const count = await buttons.count();
  const candidates = [];

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const label = ((await button.textContent()) ?? "").trim() || `<candidate ${index + 1}>`;
    const visible = await button.isVisible().catch(() => false);
    const enabled = visible ? await button.isEnabled().catch(() => false) : false;

    candidates.push({ label, visible, enabled });

    if (visible && enabled) {
      return button;
    }
  }

  const detail = candidates.length
    ? candidates.map((candidate) => `${candidate.label} [visible=${candidate.visible}, enabled=${candidate.enabled}]`).join("\n- ")
    : "none";
  throw new Error(`No visible enabled button matched ${namePattern}.\nCandidates:\n- ${detail}`);
}

function assertOctorateUrl(page, { endpoint, search = SEARCH }) {
  const url = new URL(page.url());

  assert(url.hostname === "book.octorate.com", `Expected Octorate hostname, received ${url.hostname}`);
  assert(
    url.pathname.endsWith(endpoint),
    `Expected Octorate endpoint ${endpoint}, received ${url.pathname}`,
  );
  assert(url.searchParams.get("checkin") === search.checkin, `Expected checkin=${search.checkin}`);
  assert(url.searchParams.get("checkout") === search.checkout, `Expected checkout=${search.checkout}`);
  assert(url.searchParams.get("pax") === String(search.pax), `Expected pax=${search.pax}`);
  assert(url.searchParams.get("adulti") === String(search.pax), `Expected adulti=${search.pax}`);
  assert(Boolean(url.searchParams.get("room")), "Expected Octorate room code in query params");
}

const TEST_CASES = [
  {
    id: "TC-FUN-01",
    name: "homepage commercial CTA routes to the dorm booking hub",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.home);
      await clickAndExpectUrl(
        page,
        page.getByRole("link", { name: /^Check availability$/i }).first(),
        /\/en\/book-dorm-bed$/,
      );

      assertNoPageErrors(pageErrors, "Homepage commercial CTA");
    },
  },
  {
    id: "TC-FUN-02",
    name: "homepage booking widget preserves dates and guests into booking search",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, ROUTES.home);

      const bookingSection = page.locator("#booking");
      const checkinInput = bookingSection.getByTestId("date-range-checkin-input");
      const checkoutInput = bookingSection.getByTestId("date-range-checkout-input");

      await setHiddenDateInput(page, checkinInput, SEARCH.checkin);
      await setHiddenDateInput(page, checkoutInput, SEARCH.checkout);
      await bookingSection.getByRole("button", { name: /^Increase guests$/i }).click();

      await clickAndExpectUrl(
        page,
        bookingSection.getByRole("button", { name: /^Check availability$/i }).first(),
        (urlString) => urlString.includes("/en/book-dorm-bed?"),
      );

      const url = new URL(page.url());
      assert(url.pathname === ROUTES.bookDormBed, `Expected booking widget to land on ${ROUTES.bookDormBed}`);
      assert(url.searchParams.get("checkin") === SEARCH.checkin, `Expected checkin=${SEARCH.checkin}`);
      assert(url.searchParams.get("checkout") === SEARCH.checkout, `Expected checkout=${SEARCH.checkout}`);
      assert(url.searchParams.get("pax") === "2", "Expected pax=2 after incrementing guests once");

      assertNoPageErrors(pageErrors, "Homepage booking widget");
    },
  },
  {
    id: "TC-FUN-03",
    name: "dorm booking non-refundable CTA reaches Octorate with the chosen stay",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, `${ROUTES.bookDormBed}?${buildSearchQuery()}`);
      const cta = await findFirstEnabledButton(page, /non.?refundable/i);

      await clickAndExpectUrl(page, cta, /book\.octorate\.com\/octobook\/site\/reservation\/result\.xhtml/);
      assertOctorateUrl(page, { endpoint: "result.xhtml" });

      assertNoPageErrors(pageErrors, "Dorm booking non-refundable handoff");
    },
  },
  {
    id: "TC-FUN-04",
    name: "dorm booking flexible CTA reaches Octorate with the chosen stay",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, `${ROUTES.bookDormBed}?${buildSearchQuery()}`);
      const cta = await findFirstEnabledButton(page, /flexible/i);

      await clickAndExpectUrl(page, cta, /book\.octorate\.com\/octobook\/site\/reservation\/result\.xhtml/);
      assertOctorateUrl(page, { endpoint: "result.xhtml" });

      assertNoPageErrors(pageErrors, "Dorm booking flexible handoff");
    },
  },
  {
    id: "TC-FUN-05",
    name: "room-detail sticky CTA reaches Octorate with the chosen stay",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, `${ROUTES.dormRoomDetail}?${buildSearchQuery()}`);
      const stickyCta = page.locator('[data-testid="sticky-cta"]').getByRole("link").first();

      await clickAndExpectUrl(page, stickyCta, /book\.octorate\.com\/octobook\/site\/reservation\/result\.xhtml/);
      assertOctorateUrl(page, { endpoint: "result.xhtml" });

      assertNoPageErrors(pageErrors, "Room detail sticky CTA");
    },
  },
  {
    id: "TC-FUN-06",
    name: "private-accommodations booking non-refundable CTA reaches Octorate with the chosen stay",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, `${ROUTES.privateBooking}?${buildSearchQuery()}`);
      const cta = await findFirstEnabledButton(page, /non.?refundable/i);

      await clickAndExpectUrl(page, cta, /book\.octorate\.com\/octobook\/site\/reservation\/result\.xhtml/);
      assertOctorateUrl(page, { endpoint: "result.xhtml" });

      assertNoPageErrors(pageErrors, "Private booking non-refundable handoff");
    },
  },
  {
    id: "TC-FUN-07",
    name: "private-accommodations booking flexible CTA reaches Octorate with the chosen stay",
    run: async ({ page }) => {
      const pageErrors = createPageErrorTracker(page);

      await gotoAndExpectReady(page, `${ROUTES.privateBooking}?${buildSearchQuery()}`);
      const cta = await findFirstEnabledButton(page, /flexible/i);

      await clickAndExpectUrl(page, cta, /book\.octorate\.com\/octobook\/site\/reservation\/result\.xhtml/);
      assertOctorateUrl(page, { endpoint: "result.xhtml" });

      assertNoPageErrors(pageErrors, "Private booking flexible handoff");
    },
  },
];

runSmokeSuite({
  suiteId: "brikette-live-sales-funnel",
  suiteName: "Brikette live sales funnel smoke",
  tests: TEST_CASES,
}).catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
