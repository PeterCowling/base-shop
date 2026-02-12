import { once } from "node:events";
import { createServer, type Server } from "node:http";

import { type Browser, chromium, type Page } from "playwright";

import bookingTransactionPredicates from "../../.claude/skills/meta-user-test/scripts/booking-transaction-predicates.cjs";

const { evaluateBookingTransactionCheck, collectBookingTransactionRegressionIssues } =
  bookingTransactionPredicates;

type FixtureMode = "passing" | "broken";

const PROVIDER_PATH_PATTERN =
  /book\.octorate\.com\/octobook\/site\/reservation\/(?:result|confirm)\.xhtml/i;
const PROVIDER_URL =
  "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=2";

if (typeof globalThis.setImmediate !== "function") {
  const setImmediateShim = ((callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    setTimeout(callback, 0, ...args)) as unknown as typeof setImmediate;
  const clearImmediateShim =
    ((id: ReturnType<typeof setTimeout>) => clearTimeout(id)) as unknown as typeof clearImmediate;

  // Node globals are missing in this Jest runtime; shim for Playwright.
  // @ts-expect-error runtime shim
  globalThis.setImmediate = setImmediateShim;
  // @ts-expect-error runtime shim
  globalThis.clearImmediate = clearImmediateShim;
}

function buildPage({
  title,
  heading,
  body,
}: {
  title: string;
  heading: string;
  body: string;
}) {
  return `<!doctype html>
<html data-origin="fixture">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${heading}</h1>
    ${body}
  </body>
</html>`;
}

function routeHtml(pathname: string, mode: FixtureMode) {
  const nav = `
    <nav>
      <a href="/en">Home</a>
      <a href="/en/rooms">Rooms</a>
      <a href="/en/rooms/double_room">Double Room</a>
      <a href="/en/book">Book Now</a>
    </nav>
  `;

  if (pathname === "/en") {
    if (mode === "broken") {
      return buildPage({
        title: "Hostel Brikette",
        heading: "Hostel Brikette",
        body: `${nav}<button type="button">Check availability</button>`,
      });
    }

    return buildPage({
      title: "Hostel Brikette",
      heading: "Hostel Brikette",
      body: `${nav}
        <button id="check-availability" type="button">Check availability</button>
        <div data-testid="booking-modal" style="display:none">
          <a id="booking-submit" href="${PROVIDER_URL}">Book Now</a>
        </div>
        <script>
          const trigger = document.getElementById("check-availability");
          const modal = document.querySelector("[data-testid='booking-modal']");
          if (trigger && modal) {
            trigger.addEventListener("click", () => {
              modal.setAttribute("style", "display:block");
            });
          }
        </script>
      `,
    });
  }

  if (pathname === "/en/rooms/double_room") {
    if (mode === "broken") {
      return buildPage({
        title: "Double Room",
        heading: "Double Room",
        body: `${nav}<p>Select your dates.</p>`,
      });
    }

    return buildPage({
      title: "Double Room",
      heading: "Double Room",
      body: `${nav}<a href="${PROVIDER_URL}">Reserve Now</a>`,
    });
  }

  if (pathname === "/en/rooms") {
    return buildPage({
      title: "Rooms",
      heading: "Rooms",
      body: `${nav}<a href="/en/rooms/double_room">More about this room</a>`,
    });
  }

  if (pathname === "/en/book") {
    return buildPage({
      title: "Book",
      heading: "Book",
      body: `<a href="${PROVIDER_URL}">Book Now</a>`,
    });
  }

  return buildPage({
    title: "Not Found",
    heading: "Not Found",
    body: "<p>Not found.</p>",
  });
}

async function startFixtureServer(mode: FixtureMode) {
  const server = createServer((req, res) => {
    const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
    const html = routeHtml(pathname, mode);
    const statusCode = pathname.startsWith("/en") ? 200 : 404;

    res.writeHead(statusCode, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(html);
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Fixture server failed to bind an IPv4 port.");
  }

  return {
    server,
    origin: `http://127.0.0.1:${address.port}`,
  };
}

async function clickAndCaptureHandoff(page: Page, trigger: ReturnType<Page["locator"]>) {
  const popupPromise = page.waitForEvent("popup", { timeout: 6000 }).catch(() => null);
  const samePagePromise = page
    .waitForURL(PROVIDER_PATH_PATTERN, { timeout: 6000 })
    .then(() => page.url())
    .catch(() => "");

  await trigger.click({ timeout: 5000 });

  const popup = await popupPromise;
  if (popup) {
    await popup.waitForLoadState("domcontentloaded", { timeout: 6000 }).catch(() => {});
    const popupUrl = popup.url();
    await popup.close().catch(() => {});
    return popupUrl;
  }

  return samePagePromise;
}

async function runHomeTransaction(browser: Browser, origin: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const flow = {
    flowKey: "homeModalHandoff",
    flowType: "home-modal-booking",
    routePath: "/en",
    status: "FAIL",
    hydratedInteraction: false,
    hydratedTriggerWorked: false,
    handoffHref: "",
    handoffObservedUrl: "",
    triggerText: "",
    error: "",
  };

  try {
    await page.goto(`${origin}/en`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    const trigger = page.getByRole("button", { name: /check availability/i }).first();
    const triggerVisible = await trigger.isVisible().catch(() => false);
    if (!triggerVisible) {
      flow.error = "No homepage booking CTA found.";
      return evaluateBookingTransactionCheck(flow);
    }

    flow.triggerText = ((await trigger.textContent()) || "").trim();
    await trigger.click({ timeout: 5000 });

    const modal = page.locator('[data-testid="booking-modal"]').first();
    const modalVisible = await modal.isVisible({ timeout: 2500 }).catch(() => false);
    if (!modalVisible) {
      flow.error = "Hydrated booking modal did not open.";
      return evaluateBookingTransactionCheck(flow);
    }

    flow.hydratedTriggerWorked = true;
    flow.hydratedInteraction = true;

    const submit = modal.locator("a#booking-submit").first();
    flow.handoffHref = ((await submit.getAttribute("href")) || "").trim();
    flow.handoffObservedUrl = await clickAndCaptureHandoff(page, submit);
    flow.status = "PASS";

    return evaluateBookingTransactionCheck(flow);
  } catch (error) {
    flow.error = String(error);
    return evaluateBookingTransactionCheck(flow);
  } finally {
    await context.close();
  }
}

async function runRoomTransaction(browser: Browser, origin: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const flow = {
    flowKey: "roomDetailRateHandoff",
    flowType: "room-detail-rate-booking",
    routePath: "/en/rooms/double_room",
    status: "FAIL",
    hydratedInteraction: false,
    hydratedTriggerWorked: false,
    handoffHref: "",
    handoffObservedUrl: "",
    triggerText: "",
    error: "",
  };

  try {
    await page.goto(`${origin}/en/rooms/double_room`, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    let trigger = page
      .locator("a[href*=\"book.octorate.com/octobook/site/reservation\"]")
      .first();
    let triggerVisible = await trigger.isVisible().catch(() => false);
    if (!triggerVisible) {
      trigger = page.getByRole("link", { name: /reserve now|book now/i }).first();
      triggerVisible = await trigger.isVisible().catch(() => false);
    }
    if (!triggerVisible) {
      flow.error = "No room-detail booking CTA found.";
      return evaluateBookingTransactionCheck(flow);
    }

    flow.triggerText = ((await trigger.textContent()) || "").trim();
    flow.handoffHref = ((await trigger.getAttribute("href")) || "").trim();
    flow.hydratedTriggerWorked = true;
    flow.hydratedInteraction = true;
    flow.handoffObservedUrl = await clickAndCaptureHandoff(page, trigger);
    flow.status = "PASS";

    return evaluateBookingTransactionCheck(flow);
  } catch (error) {
    flow.error = String(error);
    return evaluateBookingTransactionCheck(flow);
  } finally {
    await context.close();
  }
}

describe("meta-user-test booking transaction browser flow", () => {
  jest.setTimeout(90000);

  let browser: Browser | null = null;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      browser = null;
    }
  });

  it("passes when hydrated booking interactions hand off to provider", async () => {
    const fixture = await startFixtureServer("passing");

    try {
      const home = await runHomeTransaction(browser as Browser, fixture.origin);
      const room = await runRoomTransaction(browser as Browser, fixture.origin);
      const issues = collectBookingTransactionRegressionIssues({
        homeModalHandoff: home,
        roomDetailRateHandoff: room,
      });

      expect(home.checks.passes).toBe(true);
      expect(room.checks.passes).toBe(true);
      expect(issues).toHaveLength(0);
    } finally {
      await new Promise<void>((resolve) => {
        fixture.server.close(() => resolve());
      });
    }
  });

  it("fails when booking UI cannot complete transaction handoff", async () => {
    const fixture = await startFixtureServer("broken");

    try {
      const home = await runHomeTransaction(browser as Browser, fixture.origin);
      const room = await runRoomTransaction(browser as Browser, fixture.origin);
      const issues = collectBookingTransactionRegressionIssues({
        homeModalHandoff: home,
        roomDetailRateHandoff: room,
      });

      const issueIds = issues.map((issue: { id: string }) => issue.id);
      expect(issueIds).toContain("booking-transaction-provider-handoff");

      const regression = issues.find(
        (issue: { id: string }) => issue.id === "booking-transaction-provider-handoff"
      );
      expect(regression?.evidence?.failingFlows?.length ?? 0).toBeGreaterThan(0);
    } finally {
      await new Promise<void>((resolve) => {
        fixture.server.close(() => resolve());
      });
    }
  });
});
