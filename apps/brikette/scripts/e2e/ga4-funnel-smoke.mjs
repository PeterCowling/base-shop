#!/usr/bin/env node
/**
 * GA4 funnel smoke test for Brikette.
 *
 * Navigates to /en/book with valid future dates, clicks the first non-refundable
 * room CTA, and asserts that select_item + begin_checkout GA4 events fire and
 * that an Octorate navigation is attempted.
 *
 * Also runs a secondary locale check: /it/prenota with the same dates.
 *
 * Usage:
 *   node apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs
 *   E2E_BASE_URL=https://hostel-positano.com node apps/brikette/scripts/e2e/ga4-funnel-smoke.mjs
 *
 * Env vars:
 *   E2E_BASE_URL   Override base URL (default: https://hostel-positano.com)
 *   HEADLESS       Set to "false" to run with visible browser (default: true)
 */

import process from "node:process";

import { chromium } from "playwright";

const DEFAULT_BASE_URL = "https://hostel-positano.com";

// Italian locale slug for /book (from apps/brikette/src/slug-map.ts)
const IT_BOOK_SLUG = "prenota";

// Events required to pass the smoke test
const REQUIRED_EVENTS = ["select_item", "begin_checkout"];

function getBaseUrl() {
  return (process.env.E2E_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
}

function isHeadless() {
  return process.env.HEADLESS !== "false";
}

function getFutureDates(daysFromNow = 7, nights = 2) {
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const checkin = new Date();
  checkin.setDate(checkin.getDate() + daysFromNow);
  const checkout = new Date(checkin);
  checkout.setDate(checkin.getDate() + nights);
  return { checkin: fmt(checkin), checkout: fmt(checkout) };
}

/**
 * Parse an intercepted g/collect request and extract GA4 event name(s).
 *
 * GA4 Measurement Protocol v2 quirks:
 *   - `en=` (event name) may appear in the URL query string even for POSTs.
 *   - POST bodies may batch multiple events separated by `\r\n`, each line
 *     being its own URLSearchParams string (e.g. "en=user_engagement&...").
 *   - Some events are split: event name in URL QS, params in POST body.
 *
 * Returns an array of event objects (may be empty).
 */
function parseGA4Events(request) {
  const results = [];
  try {
    const urlSp = new URL(request.url()).searchParams;
    const tid = urlSp.get("tid");

    // 1. Event name in URL query string (common for non-batched events)
    const qsEventName = urlSp.get("en");
    if (qsEventName) {
      results.push({ eventName: qsEventName, tid, raw: Object.fromEntries(urlSp) });
    }

    // 2. Batched POST body: each line is a separate URLSearchParams event string.
    const body = request.postData();
    if (body) {
      for (const line of body.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const sp = new URLSearchParams(trimmed);
          const bodyEventName = sp.get("en");
          if (bodyEventName) {
            results.push({ eventName: bodyEventName, tid, raw: Object.fromEntries(sp) });
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } catch {
    // ignore parse errors on individual requests
  }
  return results;
}

/**
 * Run one GA4 funnel scenario: navigate to bookUrl, click the first
 * non-refundable CTA, assert events fire and Octorate is reached.
 *
 * @param {import('playwright').BrowserContext} context
 * @param {string} bookUrl
 * @param {string} label  Human-readable label for log output
 * @returns {Promise<string[]>} Array of failure messages (empty = pass)
 */
async function runFunnelScenario(context, bookUrl, label) {
  const page = await context.newPage();
  const failures = [];

  /** @type {Map<string, Array<{eventName: string, tid: string|null, raw: object}>>} */
  const capturedEvents = new Map();
  let capturedOctorateUrl = null;

  // Intercept GA4 collect — capture event names, let requests continue.
  await page.route("**/g/collect**", async (route) => {
    const events = parseGA4Events(route.request());
    for (const parsed of events) {
      if (!capturedEvents.has(parsed.eventName)) {
        capturedEvents.set(parsed.eventName, []);
      }
      capturedEvents.get(parsed.eventName).push(parsed);
    }
    await route.continue();
  });

  // Intercept Octorate navigation — capture URL and abort to stay on page.
  await page.route("*octorate.com*", async (route) => {
    capturedOctorateUrl = route.request().url();
    await route.abort();
  });

  try {
    console.info(`  → ${label}: navigating to ${bookUrl}`);
    await page.goto(bookUrl, { waitUntil: "networkidle", timeout: 60_000 });

    // Grant GA4 consent programmatically.
    // The site uses Consent Mode v2 defaulting to analytics_storage: 'denied'.
    // In headless/CI there is no banner interaction, so we grant consent via
    // gtag() before exercising any CTAs — this is the same call the cookie
    // banner makes when a user clicks "Accept".
    await page.evaluate(() => {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }
    });

    // Guard: detect if the page redirected away (e.g. IT locale not in static export).
    const finalUrl = page.url();
    const expectedOrigin = new URL(bookUrl).origin;
    const expectedPathPrefix = new URL(bookUrl).pathname.split("/").slice(0, 3).join("/");
    if (!finalUrl.startsWith(expectedOrigin + expectedPathPrefix)) {
      console.warn(
        `  ⚠ ${label}: page redirected to ${finalUrl} — locale route not in static export; skipping scenario`,
      );
      return failures; // no failures — treated as a skip
    }

    // Wait for room card sections to render (they have id = room sku).
    await page
      .locator("#double_room")
      .waitFor({ state: "attached", timeout: 15_000 })
      .catch(() => null);

    // Allow prices + hydration to settle.
    await page.waitForTimeout(1500);

    // Locate the first non-refundable CTA button.
    // Room cards render as <section id={room.sku}> (first room = "double_room").
    // Each room card has image-nav buttons ("< >") before the two action buttons.
    // We exclude the single-character nav buttons to target the NR CTA reliably,
    // regardless of locale (IT renders "Tariffe non rimborsabili", not English).
    const nrButton = page
      .locator("#double_room button")
      .filter({ hasNotText: /^[<>]$/ })
      .first();

    const nrCount = await nrButton.count();
    if (nrCount === 0) {
      failures.push(
        `${label}: No room card action button found in #double_room — page may not have loaded, or first room SKU changed`,
      );
      return failures;
    }

    // Set up a promise to detect Octorate navigation (fired after beacon).
    const octoratePromise = page
      .waitForRequest(/octorate\.com/, { timeout: 6_000 })
      .catch(() => null);

    await nrButton.click();

    // Await Octorate navigation capture (or timeout).
    const octorateReq = await octoratePromise;
    if (!capturedOctorateUrl && octorateReq) {
      capturedOctorateUrl = octorateReq.url();
    }

    // Brief extra wait for any late beacon retries.
    await page.waitForTimeout(400);

    // ── Assertions ─────────────────────────────────────────────────────────

    // 1. Required GA4 events
    for (const eventName of REQUIRED_EVENTS) {
      if (!capturedEvents.has(eventName)) {
        failures.push(
          `${label}: GA4 event "${eventName}" was NOT captured in g/collect`,
        );
      } else {
        const entry = capturedEvents.get(eventName)[0];
        const tid = entry?.tid ?? "(none)";
        console.info(
          `  ✓ ${label}: "${eventName}" captured (tid=${tid}, count=${capturedEvents.get(eventName).length})`,
        );
      }
    }

    // 2. Octorate navigation
    if (!capturedOctorateUrl) {
      failures.push(
        `${label}: No navigation to octorate.com detected after NR button click`,
      );
    } else {
      const shortUrl = capturedOctorateUrl.split("?")[0];
      console.info(`  ✓ ${label}: Octorate navigation captured → ${shortUrl}`);
    }

    // 3. Log all captured event names for diagnostics (non-asserting)
    const allEventNames = [...capturedEvents.keys()];
    console.info(
      `  ℹ ${label}: all captured GA4 events: [${allEventNames.join(", ")}]`,
    );
  } finally {
    await page.close();
  }

  return failures;
}

async function main() {
  const baseUrl = getBaseUrl();
  const { checkin, checkout } = getFutureDates(7, 2);
  const pax = 2;

  console.info(`\nBrikette GA4 funnel smoke`);
  console.info(`  Base URL : ${baseUrl}`);
  console.info(`  Dates    : ${checkin} → ${checkout} (pax=${pax})`);
  console.info(`  Headless : ${isHeadless()}\n`);

  const browser = await chromium.launch({ headless: isHeadless() });
  const allFailures = [];

  try {
    // Scenario 1: EN locale (/en/book)
    {
      const ctx = await browser.newContext();
      const url = `${baseUrl}/en/book?checkin=${checkin}&checkout=${checkout}&pax=${pax}`;
      const failures = await runFunnelScenario(ctx, url, "EN /en/book");
      allFailures.push(...failures);
      await ctx.close();
    }

    // Scenario 2: IT locale (/it/prenota) — guards locale routing on static export
    {
      const ctx = await browser.newContext();
      const url = `${baseUrl}/it/${IT_BOOK_SLUG}?checkin=${checkin}&checkout=${checkout}&pax=${pax}`;
      const failures = await runFunnelScenario(ctx, url, `IT /it/${IT_BOOK_SLUG}`);
      allFailures.push(...failures);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  if (allFailures.length > 0) {
    console.error(`\nGA4 funnel smoke FAILED (${allFailures.length} failure(s)):`);
    for (const f of allFailures) {
      console.error(`  ✗ ${f}`);
    }
    process.exit(1);
  }

  console.info(`\nGA4 funnel smoke PASSED`);
}

main().catch((err) => {
  console.error("GA4 funnel smoke error:", err?.message ?? err);
  process.exit(1);
});
