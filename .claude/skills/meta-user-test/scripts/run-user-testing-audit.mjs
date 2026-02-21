#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium, devices } from "playwright";
import axeCore from "axe-core";
import noJsPredicates from "./no-js-predicates.cjs";
import bookingTransactionPredicates from "./booking-transaction-predicates.cjs";
import discoveryPolicyPredicates from "./discovery-policy-predicates.cjs";

const { evaluateNoJsRoute, collectNoJsRegressionIssues } = noJsPredicates;
const {
  evaluateBookingTransactionCheck,
  collectBookingTransactionRegressionIssues,
} = bookingTransactionPredicates;
const {
  evaluatePolicyRoute,
  evaluateLlmsTxtCheck,
  evaluateDiscoveryPolicySet,
  collectDiscoveryPolicyRegressionIssues,
} = discoveryPolicyPredicates;

const DEFAULTS = {
  maxCrawlPages: 80,
  maxAuditPages: 24,
  maxMobilePages: 14,
  screenshotsPerViewport: 8,
  timeoutMs: 90000,
  reportDir: "docs/audits/user-testing",
  seoEnabled: true,
};

const KEYWORD_PATH_HINTS = [
  "room",
  "deal",
  "offer",
  "help",
  "support",
  "faq",
  "experience",
  "contact",
  "how-to",
  "directions",
  "terms",
  "privacy",
  "cookie",
  "policy",
  "booking",
  "checkout",
];

function parseArgs(argv) {
  const args = {
    url: "",
    slug: "",
    reportDir: DEFAULTS.reportDir,
    maxCrawlPages: DEFAULTS.maxCrawlPages,
    maxAuditPages: DEFAULTS.maxAuditPages,
    maxMobilePages: DEFAULTS.maxMobilePages,
    screenshotsPerViewport: DEFAULTS.screenshotsPerViewport,
    timeoutMs: DEFAULTS.timeoutMs,
    seoEnabled: DEFAULTS.seoEnabled,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--url" && next) {
      args.url = next;
      i += 1;
      continue;
    }
    if (token === "--slug" && next) {
      args.slug = next;
      i += 1;
      continue;
    }
    if (token === "--report-dir" && next) {
      args.reportDir = next;
      i += 1;
      continue;
    }
    if (token === "--max-crawl-pages" && next) {
      args.maxCrawlPages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-audit-pages" && next) {
      args.maxAuditPages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--max-mobile-pages" && next) {
      args.maxMobilePages = Number(next);
      i += 1;
      continue;
    }
    if (token === "--screenshots-per-viewport" && next) {
      args.screenshotsPerViewport = Number(next);
      i += 1;
      continue;
    }
    if (token === "--timeout-ms" && next) {
      args.timeoutMs = Number(next);
      i += 1;
      continue;
    }
    if (token === "--skip-seo") {
      args.seoEnabled = false;
      continue;
    }
  }

  return args;
}

function usage() {
  return [
    "Usage:",
    "  node .claude/skills/meta-user-test/scripts/run-meta-user-test.mjs --url <https://example.com/path> [options]",
    "",
    "Options:",
    "  --slug <name>                       Optional slug for output filenames",
    "  --report-dir <dir>                  Report output directory (default: docs/audits/user-testing)",
    "  --max-crawl-pages <n>               Max pages to discover (default: 80)",
    "  --max-audit-pages <n>               Max desktop pages to audit (default: 24)",
    "  --max-mobile-pages <n>              Max mobile pages to audit (default: 14)",
    "  --screenshots-per-viewport <n>      How many pages get screenshots per viewport (default: 8)",
    "  --timeout-ms <n>                    Navigation timeout (default: 90000)",
    "  --skip-seo                          Skip Lighthouse SEO/accessibility/best-practices checks",
  ].join("\n");
}

function sanitizeSlug(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function formatDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeInternalPath(href, origin) {
  try {
    if (!href) return null;
    if (
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return null;
    }

    const parsed = new URL(href, origin);
    if (parsed.origin !== origin) return null;
    parsed.hash = "";

    const normalized = `${parsed.pathname}${parsed.search}`;
    return normalized || "/";
  } catch {
    return null;
  }
}

function unique(values) {
  return [...new Set(values)];
}

function extractImageUrlsFromHtml(html, origin) {
  const matches = html.match(
    /(?:https?:\/\/[^\s"'<>]+\/img\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg|avif)|\/img\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg|avif))/gi
  );
  if (!matches) return [];

  const normalized = [];
  for (const value of matches) {
    try {
      const parsed = new URL(value, origin);
      if (parsed.origin !== origin) continue;
      parsed.hash = "";
      normalized.push(parsed.toString());
    } catch {
      // ignore malformed URL candidates
    }
  }

  return unique(normalized);
}

function pathDepth(value) {
  return value.split("/").filter(Boolean).length;
}

function selectAuditPaths(startPath, discovered, limit) {
  const normalized = unique(discovered);
  const withoutStart = normalized.filter((item) => item !== startPath);
  const keywordMatches = withoutStart.filter((item) => {
    const lower = item.toLowerCase();
    return KEYWORD_PATH_HINTS.some((hint) => lower.includes(hint));
  });

  const shallow = withoutStart
    .slice()
    .sort((a, b) => {
      const depthDelta = pathDepth(a) - pathDepth(b);
      if (depthDelta !== 0) return depthDelta;
      return a.localeCompare(b);
    })
    .slice(0, 40);

  const ordered = unique([
    startPath,
    ...keywordMatches,
    ...shallow,
    ...withoutStart,
  ]);
  return ordered.slice(0, limit);
}

function isTruthyNumber(value) {
  return Number.isFinite(value) && value >= 0;
}

function detectPrimaryLanguageFromPath(startPath) {
  const pathname = String(startPath || "/").split("?")[0] || "/";
  const segments = pathname.split("/").filter(Boolean);
  const candidate = segments[0] || "en";
  return /^[a-z]{2}$/i.test(candidate) ? candidate.toLowerCase() : "en";
}

function pickDiscoveredPath(discoveredPaths, matcher, fallbackPath) {
  const match = discoveredPaths.find((candidate) =>
    matcher(candidate.toLowerCase())
  );
  return match || fallbackPath;
}

async function runNoJsChecks(context, origin, startPath, discoveredPaths) {
  const lang = detectPrimaryLanguageFromPath(startPath);
  const routeMap = {
    home: pickDiscoveredPath(
      discoveredPaths,
      (p) => p === `/${lang}` || p === `/${lang}/`,
      `/${lang}`
    ),
    rooms: pickDiscoveredPath(
      discoveredPaths,
      (p) => p.startsWith(`/${lang}/rooms`),
      `/${lang}/rooms`
    ),
    roomDetail: pickDiscoveredPath(
      discoveredPaths,
      (p) => new RegExp(`^/${lang}/rooms/[^/]+$`).test(p),
      `/${lang}/rooms/double_room`
    ),
    experiences: pickDiscoveredPath(
      discoveredPaths,
      (p) => p.startsWith(`/${lang}/experiences`) && !/\/experiences\//.test(p),
      `/${lang}/experiences`
    ),
    howToGetHere: pickDiscoveredPath(
      discoveredPaths,
      (p) =>
        p.startsWith(`/${lang}/how-to-get-here`) &&
        !/\/how-to-get-here\//.test(p),
      `/${lang}/how-to-get-here`
    ),
    deals: pickDiscoveredPath(
      discoveredPaths,
      (p) => p.startsWith(`/${lang}/deals`),
      `/${lang}/deals`
    ),
  };

  const routeChecks = {};

  for (const [routeKey, routePath] of Object.entries(routeMap)) {
    try {
      const response = await context.request.get(`${origin}${routePath}`, {
        timeout: 30000,
      });
      const status = response.status();
      const html = status < 400 ? await response.text() : "";
      routeChecks[routeKey] = evaluateNoJsRoute({
        routeKey,
        routePath,
        status,
        html,
      });
    } catch (error) {
      routeChecks[routeKey] = {
        routePath,
        status: "ERR",
        error: String(error),
        h1Count: 0,
        titleText: "",
        hasBailoutMarker: false,
        bookingFunnelI18nKeyLeakSamples: [],
        ctaFallback: {
          hasFallbackLink: false,
          failingLabels: [],
          details: {
            checkAvailability: {
              label: "Check availability",
              buttonCount: 0,
              anchorCount: 0,
            },
            bookNow: { label: "Book Now", buttonCount: 0, anchorCount: 0 },
          },
        },
        checks: {
          hasMeaningfulH1: false,
          hasNoBailoutMarker: false,
          hasNoBookingFunnelI18nLeak: false,
          hasBookingCtaFallback: false,
          hasVisibleBookingCtaLabel: false,
          hasCrawlableGuideLinks: false,
          hasRoomInventoryCrawlability: false,
        },
      };
      if (routeKey === "home") {
        routeChecks[routeKey].checks.hasNoI18nKeyLeak = false;
        routeChecks[routeKey].checks.hasSocialProofSnapshotDate = false;
        routeChecks[routeKey].checks.hasMailtoContactLink = false;
        routeChecks[routeKey].checks.hasNamedSocialLinks = false;
        routeChecks[routeKey].i18nKeyLeakSamples = [];
        routeChecks[routeKey].mailto = { hasMailtoLink: false, linkCount: 0 };
        routeChecks[routeKey].socialLinks = {
          hasNamedSocialLinks: false,
          socialLinkCount: 0,
          unnamedSocialLinks: [],
        };
      }
      if (routeKey === "deals") {
        routeChecks[routeKey].checks.hasMetadataBodyParity = false;
        routeChecks[routeKey].dealsParity = {
          titlePercentClaim: "",
          bodyHasPercentClaim: false,
          bodyIndicatesExpiredOffer: false,
        };
      }
    }
  }

  return {
    lang,
    routeChecks,
  };
}

async function runDiscoveryPolicyChecks(
  context,
  origin,
  startPath,
  discoveredPaths
) {
  const lang = detectPrimaryLanguageFromPath(startPath);
  const policyPaths = unique(deriveSeoPaths(startPath, discoveredPaths));
  const routeChecks = [];

  for (const routePath of policyPaths) {
    try {
      const response = await context.request.get(`${origin}${routePath}`, {
        timeout: 30000,
      });
      const status = response.status();
      const html = await response.text().catch(() => "");
      const headers = response.headers();

      routeChecks.push(
        evaluatePolicyRoute({
          routePath,
          status,
          html,
          headers,
          lang,
        })
      );
    } catch (error) {
      routeChecks.push(
        evaluatePolicyRoute({
          routePath,
          status: "ERR",
          html: "",
          headers: {},
          lang,
          error: String(error),
        })
      );
    }
  }

  let llmsTxtCheck;
  try {
    const response = await context.request.get(`${origin}/llms.txt`, {
      timeout: 30000,
    });
    llmsTxtCheck = evaluateLlmsTxtCheck({
      status: response.status(),
      body: await response.text().catch(() => ""),
      headers: response.headers(),
    });
  } catch (error) {
    llmsTxtCheck = evaluateLlmsTxtCheck({
      status: "ERR",
      body: "",
      headers: {},
      error: String(error),
    });
  }

  return evaluateDiscoveryPolicySet({
    origin,
    startPath,
    routeChecks,
    llmsTxtCheck,
  });
}

const BOOKING_CTA_LABEL_PATTERN = /check availability|book now|reserve now/i;
const BOOKING_RATE_BUTTON_PATTERN =
  /non.?refundable|flexible|check rates/i;
const BOOKING_CONFIRM_LABEL_PATTERN = /confirm|continue|book now|reserve now/i;
const BOOKING_PROVIDER_URL_PATTERN =
  /book\.octorate\.com\/octobook\/site\/reservation\/(?:result|confirm)\.xhtml/i;
const BOOKING_DIRECT_CTA_PRIMARY_PATTERN = /book now|reserve now/i;
const BOOKING_DIRECT_CTA_SECONDARY_PATTERN = /check availability/i;

async function firstVisibleLocator(locators) {
  for (const locator of locators) {
    const candidate = locator.first();
    const count = await candidate.count();
    if (!count) continue;
    const visible = await candidate.isVisible().catch(() => false);
    if (visible) return candidate;
  }
  return null;
}

async function firstVisibleEnabledLocator(locators) {
  for (const locator of locators) {
    const count = await locator.count();
    if (!count) continue;

    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      const enabled = await candidate.isEnabled().catch(() => true);
      if (!enabled) continue;
      return candidate;
    }
  }
  return null;
}

async function waitForHydratedShell(page, timeoutMs) {
  const budget = Math.min(Math.max(4000, Math.floor(timeoutMs / 3)), 20000);
  await page
    .waitForLoadState("domcontentloaded", { timeout: budget })
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const root = document.documentElement;
        const hasOriginMarker = Boolean(root?.getAttribute("data-origin"));
        const hasNextPayload = Boolean(window.__NEXT_DATA__);
        const domReady =
          document.readyState === "interactive" ||
          document.readyState === "complete";
        return domReady && (hasOriginMarker || hasNextPayload);
      },
      { timeout: budget }
    )
    .catch(() => {});
  await page.waitForTimeout(350);
}

async function clickAndCaptureProviderHandoff(page, trigger, timeoutMs) {
  await trigger.scrollIntoViewIfNeeded().catch(() => {});
  const href = ((await trigger.getAttribute("href")) || "").trim();

  const popupPromise = page
    .waitForEvent("popup", { timeout: 12000 })
    .catch(() => null);
  const samePageNavigation = page
    .waitForURL(BOOKING_PROVIDER_URL_PATTERN, { timeout: 12000 })
    .then(() => page.url())
    .catch(() => "");

  await trigger.click({ timeout: 8000 }).catch(() => {});

  let observedUrl = "";
  const popup = await popupPromise;
  if (popup) {
    await popup
      .waitForLoadState("domcontentloaded", {
        timeout: Math.min(12000, timeoutMs),
      })
      .catch(() => {});
    observedUrl = popup.url();
    await popup.close().catch(() => {});
  } else {
    observedUrl = await samePageNavigation;
  }

  // Some CTAs route to /:lang/book before hitting provider.
  if (!observedUrl && /\/[a-z]{2}\/book(?:[/?#]|$)/i.test(page.url())) {
    const providerAction = await firstVisibleEnabledLocator([
      page.locator('a[href*="book.octorate.com/octobook/site/reservation"]'),
      page.locator("a,button").filter({ hasText: BOOKING_CTA_LABEL_PATTERN }),
    ]);
    if (providerAction) {
      await providerAction.scrollIntoViewIfNeeded().catch(() => {});
      const nestedPopup = page
        .waitForEvent("popup", { timeout: 10000 })
        .catch(() => null);
      const nestedNavigation = page
        .waitForURL(BOOKING_PROVIDER_URL_PATTERN, { timeout: 10000 })
        .then(() => page.url())
        .catch(() => "");
      await providerAction.click({ timeout: 8000 }).catch(() => {});
      const popup2 = await nestedPopup;
      if (popup2) {
        await popup2
          .waitForLoadState("domcontentloaded", { timeout: 10000 })
          .catch(() => {});
        observedUrl = popup2.url();
        await popup2.close().catch(() => {});
      } else {
        observedUrl = await nestedNavigation;
      }
    }
  }

  return {
    href,
    observedUrl,
  };
}

async function runHomeBookingFlow(context, origin, routePath, options) {
  const page = await context.newPage();
  const result = {
    flowKey: "homeModalHandoff",
    flowType: "home-modal-booking",
    routePath,
    status: "FAIL",
    hydratedInteraction: false,
    hydratedTriggerWorked: false,
    handoffHref: "",
    handoffObservedUrl: "",
    triggerText: "",
    error: "",
  };

  try {
    await page.goto(`${origin}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });
    await waitForHydratedShell(page, options.timeoutMs);

    let trigger = await firstVisibleEnabledLocator([
      page.getByRole("link", { name: BOOKING_CTA_LABEL_PATTERN }),
      page.getByRole("button", { name: BOOKING_CTA_LABEL_PATTERN }),
      page.locator("a,button").filter({ hasText: BOOKING_CTA_LABEL_PATTERN }),
    ]);

    if (!trigger) {
      result.error = "No visible booking CTA trigger found on homepage.";
      return evaluateBookingTransactionCheck(result);
    }

    result.triggerText = ((await trigger.textContent()) || "").trim();

    const bookingModal = page.locator('[data-testid="booking-modal"]');
    let modalVisible = false;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (!trigger) break;
      await trigger.scrollIntoViewIfNeeded().catch(() => {});
      await trigger.click({ timeout: 8000 }).catch(() => {});

      modalVisible = await bookingModal
        .first()
        .isVisible({ timeout: 3500 })
        .catch(() => false);
      if (modalVisible) break;

      await waitForHydratedShell(page, options.timeoutMs);
      trigger = await firstVisibleEnabledLocator([
        page.getByRole("link", { name: BOOKING_CTA_LABEL_PATTERN }),
        page.getByRole("button", { name: BOOKING_CTA_LABEL_PATTERN }),
        page.locator("a,button").filter({ hasText: BOOKING_CTA_LABEL_PATTERN }),
      ]);
    }

    if (!modalVisible) {
      result.error =
        "Hydrated booking modal did not open after clicking homepage CTA.";
      return evaluateBookingTransactionCheck(result);
    }
    result.hydratedTriggerWorked = true;

    const submit = await firstVisibleEnabledLocator([
      page.locator('[data-testid="booking-modal"] a#booking-submit'),
      page.locator(
        '[data-testid="booking-modal"] a[href*="book.octorate.com/octobook/site/reservation"]'
      ),
    ]);

    if (!submit) {
      result.error =
        "Booking modal opened but no visible provider handoff action was found.";
      return evaluateBookingTransactionCheck(result);
    }

    result.handoffHref = ((await submit.getAttribute("href")) || "").trim();
    result.hydratedInteraction = true;

    const popupPromise = page
      .waitForEvent("popup", { timeout: 12000 })
      .catch(() => null);
    const samePageNavigation = page
      .waitForURL(BOOKING_PROVIDER_URL_PATTERN, { timeout: 12000 })
      .then(() => page.url())
      .catch(() => "");

    await submit.click({ timeout: 8000 });

    const popup = await popupPromise;
    if (popup) {
      await popup
        .waitForLoadState("domcontentloaded", { timeout: 12000 })
        .catch(() => {});
      result.handoffObservedUrl = popup.url();
      await popup.close().catch(() => {});
    } else {
      result.handoffObservedUrl = await samePageNavigation;
    }

    result.status = "PASS";
    return evaluateBookingTransactionCheck(result);
  } catch (error) {
    result.error = String(error);
    return evaluateBookingTransactionCheck(result);
  } finally {
    await page.close();
  }
}

async function runRoomDetailBookingFlow(context, origin, routePath, options) {
  const page = await context.newPage();
  const result = {
    flowKey: "roomDetailRateHandoff",
    flowType: "room-detail-rate-booking",
    routePath,
    status: "FAIL",
    hydratedInteraction: false,
    hydratedTriggerWorked: false,
    handoffHref: "",
    handoffObservedUrl: "",
    triggerText: "",
    error: "",
  };

  try {
    await page.goto(`${origin}${routePath}`, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });
    await waitForHydratedShell(page, options.timeoutMs);

    const rateAction = await firstVisibleEnabledLocator([
      page
        .locator("article button")
        .filter({ hasText: BOOKING_RATE_BUTTON_PATTERN }),
      page.getByRole("button", { name: BOOKING_RATE_BUTTON_PATTERN }),
    ]);

    if (rateAction) {
      result.triggerText = ((await rateAction.textContent()) || "").trim();

      const bookingModal2 = page.locator('[data-testid="booking-modal-2"]');
      let modalVisible = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await rateAction.scrollIntoViewIfNeeded().catch(() => {});
        await rateAction.click({ timeout: 8000 }).catch(() => {});

        modalVisible = await bookingModal2
          .first()
          .isVisible({ timeout: 3500 })
          .catch(() => false);
        if (modalVisible) break;

        await waitForHydratedShell(page, options.timeoutMs);
      }

      if (modalVisible) {
        result.hydratedTriggerWorked = true;

        const confirmButton = await firstVisibleEnabledLocator([
          page
            .locator('[data-testid="booking-modal-2"] button')
            .filter({ hasText: BOOKING_CONFIRM_LABEL_PATTERN }),
        ]);

        if (!confirmButton) {
          result.error =
            "Rate-selection modal opened but no visible confirm action was found.";
          return evaluateBookingTransactionCheck(result);
        }

        result.hydratedInteraction = true;
        const samePageNavigation = page
          .waitForURL(BOOKING_PROVIDER_URL_PATTERN, { timeout: 15000 })
          .then(() => page.url())
          .catch(() => "");

        await confirmButton.click({ timeout: 8000 });
        result.handoffObservedUrl = await samePageNavigation;
        result.status = "PASS";
        return evaluateBookingTransactionCheck(result);
      }
    }

    // Fallback: room-detail pages may expose a direct hydrated provider CTA
    // (for example a sticky reserve button) instead of rate-selector actions.
    const directTrigger = await firstVisibleEnabledLocator([
      page
        .locator('[data-testid="sticky-cta"] a, [data-testid="sticky-cta"] button')
        .filter({ hasText: BOOKING_DIRECT_CTA_PRIMARY_PATTERN }),
      page.locator("main a, main button").filter({
        hasText: BOOKING_DIRECT_CTA_PRIMARY_PATTERN,
      }),
      page.locator("main a, main button").filter({
        hasText: BOOKING_DIRECT_CTA_SECONDARY_PATTERN,
      }),
    ]);

    if (!directTrigger) {
      result.error =
        "No actionable room-detail booking trigger found (rate modal or direct provider CTA).";
      return evaluateBookingTransactionCheck(result);
    }

    result.triggerText = ((await directTrigger.textContent()) || "").trim();
    const directHandoff = await clickAndCaptureProviderHandoff(
      page,
      directTrigger,
      options.timeoutMs
    );
    result.handoffHref = directHandoff.href;
    result.handoffObservedUrl = directHandoff.observedUrl;
    result.hydratedTriggerWorked = true;
    result.hydratedInteraction = true;
    result.status = "PASS";
    return evaluateBookingTransactionCheck(result);
  } catch (error) {
    result.error = String(error);
    return evaluateBookingTransactionCheck(result);
  } finally {
    await page.close();
  }
}

async function runBookingTransactionChecks(
  context,
  origin,
  startPath,
  discoveredPaths,
  options
) {
  const lang = detectPrimaryLanguageFromPath(startPath);
  const routeMap = {
    home: pickDiscoveredPath(
      discoveredPaths,
      (p) => p === `/${lang}` || p === `/${lang}/`,
      `/${lang}`
    ),
    roomDetail: pickDiscoveredPath(
      discoveredPaths,
      (p) => new RegExp(`^/${lang}/rooms/[^/]+$`).test(p),
      `/${lang}/rooms/double_room`
    ),
  };

  const flowChecks = {};
  flowChecks.homeModalHandoff = await runHomeBookingFlow(
    context,
    origin,
    routeMap.home,
    options
  );
  flowChecks.roomDetailRateHandoff = await runRoomDetailBookingFlow(
    context,
    origin,
    routeMap.roomDetail,
    options
  );

  return {
    lang,
    routeMap,
    flowChecks,
  };
}

function summarizeLighthouseDocument(document, pagePath, formFactor) {
  const categories = document.categories || {};
  const audits = document.audits || {};
  const score = (categoryId) => {
    const raw = categories[categoryId]?.score;
    return typeof raw === "number" ? Math.round(raw * 100) : null;
  };

  const failedAuditIds = Object.entries(audits)
    .filter(([, audit]) => {
      if (!audit || typeof audit !== "object") return false;
      const scoreDisplayMode = audit.scoreDisplayMode;
      const scoreValue = audit.score;
      if (scoreDisplayMode === "notApplicable" || scoreDisplayMode === "manual")
        return false;
      return typeof scoreValue === "number" && scoreValue < 1;
    })
    .map(([auditId]) => auditId);

  return {
    pagePath,
    formFactor,
    seo: score("seo"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    failedAuditIds,
  };
}

function runLighthouseOnce({ url, outputPath, formFactor }) {
  const args = [
    "lighthouse",
    url,
    "--chrome-flags=--headless --no-sandbox",
    "--only-categories=seo,accessibility,best-practices",
    "--output=json",
    `--output-path=${outputPath}`,
  ];

  if (formFactor === "desktop") {
    args.push("--preset=desktop");
  } else {
    args.push(
      "--form-factor=mobile",
      "--screenEmulation.mobile=true",
      "--throttling-method=provided"
    );
  }

  const result = spawnSync("npx", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 25,
  });

  if (result.status !== 0) {
    throw new Error(
      `Lighthouse failed for ${url} (${formFactor}): ${result.stderr || result.stdout || "unknown error"}`
    );
  }
}

function deriveSeoPaths(startPath, discoveredPaths) {
  const lang = detectPrimaryLanguageFromPath(startPath);
  const homePath = pickDiscoveredPath(
    discoveredPaths,
    (p) => p === `/${lang}` || p === `/${lang}/`,
    `/${lang}`
  );
  const roomsPath = pickDiscoveredPath(
    discoveredPaths,
    (p) => p.startsWith(`/${lang}/rooms`) && !/\/rooms\//.test(p),
    `/${lang}/rooms`
  );
  const helpPath = pickDiscoveredPath(
    discoveredPaths,
    (p) =>
      (p.startsWith(`/${lang}/help`) && !/\/help\//.test(p)) ||
      (p.startsWith(`/${lang}/assistance`) && !/\/assistance\//.test(p)),
    `/${lang}/help`
  );

  return [homePath, roomsPath, helpPath];
}

async function runSeoChecks({
  origin,
  startPath,
  discoveredPaths,
  seoArtifactsDir,
  seoEnabled,
}) {
  if (!seoEnabled) {
    return {
      enabled: false,
      pages: [],
      errors: [],
    };
  }

  const pages = [];
  const errors = [];
  const pagePaths = deriveSeoPaths(startPath, discoveredPaths);

  await fs.mkdir(seoArtifactsDir, { recursive: true });

  for (const pagePath of pagePaths) {
    const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
    const url = `${origin}${normalizedPath}`;
    const safeName = sanitizeSlug(normalizedPath) || "root";
    const desktopPath = path.join(seoArtifactsDir, `${safeName}-desktop.json`);
    const mobilePath = path.join(seoArtifactsDir, `${safeName}-mobile.json`);

    try {
      runLighthouseOnce({
        url,
        outputPath: desktopPath,
        formFactor: "desktop",
      });
      runLighthouseOnce({
        url,
        outputPath: mobilePath,
        formFactor: "mobile",
      });

      const desktopRaw = JSON.parse(await fs.readFile(desktopPath, "utf8"));
      const mobileRaw = JSON.parse(await fs.readFile(mobilePath, "utf8"));
      const desktop = summarizeLighthouseDocument(
        desktopRaw,
        normalizedPath,
        "desktop"
      );
      const mobile = summarizeLighthouseDocument(
        mobileRaw,
        normalizedPath,
        "mobile"
      );

      const repeatedFailedAuditIds = desktop.failedAuditIds.filter((auditId) =>
        mobile.failedAuditIds.includes(auditId)
      );

      pages.push({
        pagePath: normalizedPath,
        url,
        desktop,
        mobile,
        repeatedFailedAuditIds,
      });
    } catch (error) {
      errors.push({
        pagePath: normalizedPath,
        url,
        error: String(error),
      });
    }
  }

  return {
    enabled: true,
    pages,
    errors,
    averageScores: {
      seo:
        pages.length > 0
          ? Math.round(
              pages.reduce(
                (sum, page) =>
                  sum + (page.desktop.seo ?? 0) + (page.mobile.seo ?? 0),
                0
              ) /
                (pages.length * 2)
            )
          : null,
      accessibility:
        pages.length > 0
          ? Math.round(
              pages.reduce(
                (sum, page) =>
                  sum +
                  (page.desktop.accessibility ?? 0) +
                  (page.mobile.accessibility ?? 0),
                0
              ) /
                (pages.length * 2)
            )
          : null,
      bestPractices:
        pages.length > 0
          ? Math.round(
              pages.reduce(
                (sum, page) =>
                  sum +
                  (page.desktop.bestPractices ?? 0) +
                  (page.mobile.bestPractices ?? 0),
                0
              ) /
                (pages.length * 2)
            )
          : null,
    },
  };
}

async function crawlInternalPaths(context, origin, startPath, options) {
  const discovered = new Set([startPath]);
  const visited = new Set();
  const queue = [startPath];
  const pageLinks = {};
  const crawlErrors = [];

  const page = await context.newPage();

  while (queue.length > 0 && visited.size < options.maxCrawlPages) {
    const currentPath = queue.shift();
    if (!currentPath || visited.has(currentPath)) continue;

    visited.add(currentPath);

    try {
      await page.goto(`${origin}${currentPath}`, {
        waitUntil: "domcontentloaded",
        timeout: options.timeoutMs,
      });
      await page.waitForTimeout(1600);

      const hrefs = await page.$$eval("a[href]", (anchors) =>
        anchors
          .map((anchor) => anchor.getAttribute("href") || "")
          .filter(Boolean)
      );

      const normalized = unique(
        hrefs.map((href) => normalizeInternalPath(href, origin)).filter(Boolean)
      );

      pageLinks[currentPath] = normalized;

      for (const candidate of normalized) {
        if (!discovered.has(candidate)) discovered.add(candidate);
        if (!visited.has(candidate) && !queue.includes(candidate))
          queue.push(candidate);
      }
    } catch (error) {
      crawlErrors.push({
        page: currentPath,
        error: String(error),
      });
    }
  }

  await page.close();

  return {
    discoveredPaths: [...discovered],
    visitedPaths: [...visited],
    pageLinks,
    crawlErrors,
  };
}

async function checkInternalPaths(context, origin, paths) {
  const results = [];

  for (const pagePath of paths) {
    try {
      const response = await context.request.get(`${origin}${pagePath}`, {
        timeout: 30000,
      });
      results.push({
        page: pagePath,
        status: response.status(),
      });
    } catch (error) {
      results.push({
        page: pagePath,
        status: "ERR",
        error: String(error),
      });
    }
  }

  return results;
}

async function sweepImageAssets(context, origin, paths) {
  const assetToPages = new Map();
  const pageFetchErrors = [];

  for (const pagePath of paths) {
    try {
      const response = await context.request.get(`${origin}${pagePath}`, {
        timeout: 30000,
      });
      if (response.status() >= 400) continue;

      const html = await response.text();
      const imageUrls = extractImageUrlsFromHtml(html, origin);

      for (const imageUrl of imageUrls) {
        if (!assetToPages.has(imageUrl)) assetToPages.set(imageUrl, new Set());
        assetToPages.get(imageUrl).add(pagePath);
      }
    } catch (error) {
      pageFetchErrors.push({
        page: pagePath,
        error: String(error),
      });
    }
  }

  const imageChecks = [];
  for (const imageUrl of assetToPages.keys()) {
    try {
      const response = await context.request.get(imageUrl, {
        timeout: 30000,
      });
      imageChecks.push({
        imageUrl,
        status: response.status(),
        pages: [...assetToPages.get(imageUrl)],
      });
    } catch (error) {
      imageChecks.push({
        imageUrl,
        status: "ERR",
        error: String(error),
        pages: [...assetToPages.get(imageUrl)],
      });
    }
  }

  return {
    checkedImageCount: imageChecks.length,
    pageFetchErrors,
    brokenImages: imageChecks
      .filter(
        (item) =>
          item.status === "ERR" ||
          (typeof item.status === "number" && item.status >= 400)
      )
      .sort((a, b) => {
        const aStatus = a.status === "ERR" ? 999 : a.status;
        const bStatus = b.status === "ERR" ? 999 : b.status;
        return bStatus - aStatus;
      }),
  };
}

async function runAxe(page) {
  await page.addScriptTag({ content: axeCore.source });
  return page.evaluate(async () => {
    const run = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      resultTypes: ["violations"],
    });

    return run.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      description: violation.description,
      nodeCount: violation.nodes.length,
      nodes: violation.nodes.slice(0, 4).map((node) => ({
        target: node.target,
        failureSummary: node.failureSummary,
      })),
    }));
  });
}

async function auditPage(
  context,
  origin,
  pagePath,
  viewportLabel,
  screenshotPath,
  options
) {
  const page = await context.newPage();
  const consoleErrors = [];
  const badResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  page.on("response", (response) => {
    const status = response.status();
    if (status < 400) return;

    let pathname = "";
    try {
      pathname = new URL(response.url()).pathname;
    } catch {
      pathname = response.url();
    }

    badResponses.push({
      status,
      url: response.url(),
      path: pathname,
      method: response.request().method(),
      resourceType: response.request().resourceType(),
    });
  });

  let navStatus = null;
  let navError = null;

  try {
    const response = await page.goto(`${origin}${pagePath}`, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs,
    });
    navStatus = response ? response.status() : null;
    await page.waitForTimeout(1500);
  } catch (error) {
    navError = String(error);
  }

  let dom = null;
  let axeViolations = [];

  if (!navError) {
    dom = await page.evaluate(() => {
      const isVisible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      };

      const root = document.documentElement;
      const body = document.body;

      const images = [...document.querySelectorAll("img")].map((image) => ({
        src: image.currentSrc || image.getAttribute("src") || "",
        alt: image.getAttribute("alt"),
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      }));

      const brokenImages = images.filter(
        (image) => image.complete && image.naturalWidth === 0
      );
      const missingAltImages = images.filter((image) => image.alt === null);

      const clickables = [
        ...document.querySelectorAll(
          "a[href], button, [role=button], input, select, textarea"
        ),
      ]
        .filter((element) => isVisible(element))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName,
            text: (element.textContent || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 80),
            ariaLabel: element.getAttribute("aria-label"),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });

      const tinyTargets24 = clickables.filter(
        (item) => item.width < 24 || item.height < 24
      );
      const tinyTargets44 = clickables.filter(
        (item) => item.width < 44 || item.height < 44
      );

      const textBody = document.body ? document.body.innerText : "";
      const i18nKeySamples = [
        ...new Set(
          (textBody.match(/\b[a-z]+(?:\.[a-z0-9_]+){2,}\b/gi) || []).slice(
            0,
            20
          )
        ),
      ];

      const mobileMenu = (() => {
        const toggle = document.querySelector("button[aria-label*=menu i]");
        const panel =
          document.querySelector("[data-testid*=mobile-menu i]") ||
          document.querySelector("[id*=mobile-menu i]") ||
          document.querySelector(".mobile-menu");

        if (!panel) return null;

        const style = getComputedStyle(panel);
        const linksVisible = [...panel.querySelectorAll("a[href]")].filter(
          (anchor) => isVisible(anchor)
        ).length;
        const panelClass = String(panel.className || "");
        const likelyClosedClass = /translate-y-full|hidden|opacity-0/.test(
          panelClass
        );
        const panelVisible =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0";
        const hasLeak = Boolean(
          panelVisible &&
            likelyClosedClass &&
            linksVisible > 0 &&
            style.transform === "none"
        );

        return {
          hasLeak,
          linksVisible,
          panelClass,
          panelTransform: style.transform,
          panelDisplay: style.display,
          panelVisibility: style.visibility,
          toggleExpanded: toggle ? toggle.getAttribute("aria-expanded") : null,
        };
      })();

      return {
        title: document.title,
        htmlLang: root.getAttribute("lang"),
        h1: [...document.querySelectorAll("h1")]
          .map((node) => (node.textContent || "").trim())
          .filter(Boolean),
        imageCount: images.length,
        brokenImageCount: brokenImages.length,
        brokenImageSamples: brokenImages.slice(0, 8),
        missingAltImageCount: missingAltImages.length,
        missingAltImageSamples: missingAltImages.slice(0, 8),
        clickablesCount: clickables.length,
        tinyTapTargets24: tinyTargets24.length,
        tinyTapTargets44: tinyTargets44.length,
        tinyTapTargets44Samples: tinyTargets44.slice(0, 10),
        hasHorizontalOverflow: root.scrollWidth > root.clientWidth,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        bodyScrollWidth: body ? body.scrollWidth : null,
        i18nKeySamples,
        mobileMenu,
      };
    });

    axeViolations = await runAxe(page);

    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }
  }

  await page.close();

  return {
    page: pagePath,
    viewport: viewportLabel,
    navStatus,
    navError,
    dom,
    consoleErrors,
    badResponses,
    axeViolations,
  };
}

function aggregateFindings(payload) {
  const allResults = [...payload.desktopResults, ...payload.mobileResults];
  const issueList = [];

  const noJsRouteChecks = payload.noJsChecks?.routeChecks ?? {};
  issueList.push(...collectNoJsRegressionIssues(noJsRouteChecks));
  issueList.push(
    ...collectDiscoveryPolicyRegressionIssues(payload.discoveryPolicyChecks)
  );
  const bookingTransactionFlowChecks =
    payload.bookingTransactionChecks?.flowChecks ?? {};
  issueList.push(
    ...collectBookingTransactionRegressionIssues(bookingTransactionFlowChecks)
  );

  const brokenInternal = payload.linkChecks.filter(
    (item) => typeof item.status === "number" && item.status >= 400
  );
  if (brokenInternal.length > 0) {
    issueList.push({
      id: "broken-internal-routes",
      priority: "P0",
      title: "Internal routes return 4xx/5xx",
      evidence: {
        brokenCount: brokenInternal.length,
        samples: brokenInternal.slice(0, 12),
      },
      acceptanceCriteria: [
        "Every internal navigation route linked from the audited pages returns HTTP 200 (or expected redirect).",
        "No help/support/article link in the audited navigation returns 404.",
        "Automated link check passes for audited internal routes.",
      ],
    });
  }

  const i18nLeaks = allResults
    .filter(
      (result) =>
        result.dom &&
        result.dom.i18nKeySamples &&
        result.dom.i18nKeySamples.length > 0
    )
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      samples: result.dom.i18nKeySamples.slice(0, 5),
    }));

  if (i18nLeaks.length > 0) {
    issueList.push({
      id: "untranslated-i18n-keys",
      priority: "P0",
      title: "Raw i18n keys leak into user-visible UI",
      evidence: {
        pageCount: unique(i18nLeaks.map((item) => item.page)).length,
        samples: i18nLeaks.slice(0, 12),
      },
      acceptanceCriteria: [
        "All user-facing labels, headings, and descriptions resolve to localized strings.",
        "No `namespace.key.path` patterns appear in rendered UI text on audited pages.",
        "Both desktop and mobile snapshots for affected pages show translated content only.",
      ],
    });
  }

  const brokenImagesFromViewportAudits = allResults
    .filter((result) => {
      const domBroken = result.dom ? result.dom.brokenImageCount > 0 : false;
      const networkBroken = result.badResponses.some(
        (response) =>
          response.resourceType === "image" && response.status >= 400
      );
      return domBroken || networkBroken;
    })
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      brokenImageCount: result.dom ? result.dom.brokenImageCount : 0,
      brokenImageResponseCount: result.badResponses.filter(
        (response) =>
          response.resourceType === "image" && response.status >= 400
      ).length,
    }));

  const brokenImagesFromAssetSweep = payload.imageSweep
    ? payload.imageSweep.brokenImages
    : [];
  const totalBrokenImageSignals =
    brokenImagesFromViewportAudits.length + brokenImagesFromAssetSweep.length;
  if (totalBrokenImageSignals > 0) {
    const brokenPages = unique([
      ...brokenImagesFromViewportAudits.map((item) => item.page),
      ...brokenImagesFromAssetSweep.flatMap((item) => item.pages || []),
    ]);

    issueList.push({
      id: "broken-images",
      priority: brokenImagesFromAssetSweep.length >= 5 ? "P0" : "P1",
      title: "Image assets fail to render",
      evidence: {
        pageCount: brokenPages.length,
        viewportAuditSamples: brokenImagesFromViewportAudits.slice(0, 12),
        assetSweepBrokenCount: brokenImagesFromAssetSweep.length,
        assetSweepSamples: brokenImagesFromAssetSweep.slice(0, 12),
      },
      acceptanceCriteria: [
        "No `img` elements decode to `naturalWidth=0` on audited pages.",
        "No image requests return 4xx/5xx for audited pages and viewports.",
        "Sitewide HTML image-asset sweep reports 0 broken `/img/...` references.",
        "Lazy-loaded images render successfully after full-page scroll.",
      ],
    });
  }

  const colorContrast = allResults
    .map((result) => {
      const violation = result.axeViolations.find(
        (item) => item.id === "color-contrast"
      );
      if (!violation) return null;
      return {
        page: result.page,
        viewport: result.viewport,
        nodeCount: violation.nodeCount,
        help: violation.help,
      };
    })
    .filter(Boolean);

  if (colorContrast.length > 0) {
    issueList.push({
      id: "color-contrast",
      priority: "P1",
      title: "WCAG color contrast failures",
      evidence: {
        pageCount: unique(colorContrast.map((item) => item.page)).length,
        sampleViolations: colorContrast.slice(0, 12),
      },
      acceptanceCriteria: [
        "Text contrast meets WCAG AA thresholds (4.5:1 for normal text, 3:1 for large text).",
        "Axe `color-contrast` reports 0 violations on homepage and key landing pages.",
        "Updated palette passes both desktop and mobile checks.",
      ],
    });
  }

  const mobileMenuLeaks = payload.mobileResults
    .filter(
      (result) =>
        result.dom && result.dom.mobileMenu && result.dom.mobileMenu.hasLeak
    )
    .map((result) => ({
      page: result.page,
      leak: result.dom.mobileMenu,
    }));

  if (mobileMenuLeaks.length > 0) {
    issueList.push({
      id: "mobile-menu-state-leak",
      priority: "P1",
      title: "Mobile menu appears/focuses when marked closed",
      evidence: {
        pageCount: unique(mobileMenuLeaks.map((item) => item.page)).length,
        samples: mobileMenuLeaks.slice(0, 12),
      },
      acceptanceCriteria: [
        "When menu toggle is closed (`aria-expanded=false`), menu links are not visible or focusable.",
        "Closed-state menu panel has an effective offscreen/hidden transform in computed styles.",
        "Keyboard tab order skips mobile nav links until menu is explicitly opened.",
      ],
    });
  }

  const progressbarName = allResults
    .map((result) => {
      const violation = result.axeViolations.find(
        (item) => item.id === "aria-progressbar-name"
      );
      if (!violation) return null;
      return {
        page: result.page,
        viewport: result.viewport,
        nodeCount: violation.nodeCount,
      };
    })
    .filter(Boolean);

  if (progressbarName.length > 0) {
    issueList.push({
      id: "aria-progressbar-name",
      priority: "P2",
      title: "Progressbar ARIA name missing",
      evidence: {
        pageCount: unique(progressbarName.map((item) => item.page)).length,
        samples: progressbarName.slice(0, 12),
      },
      acceptanceCriteria: [
        "Every `role=progressbar` element has a valid accessible name (`aria-label` or `aria-labelledby`).",
        "Axe `aria-progressbar-name` reports 0 violations on audited pages.",
      ],
    });
  }

  const fetch404s = allResults.flatMap((result) =>
    result.badResponses
      .filter((response) => {
        if (
          response.resourceType === "document" ||
          response.resourceType === "image"
        )
          return false;
        return response.status >= 400;
      })
      .map((response) => ({
        page: result.page,
        viewport: result.viewport,
        status: response.status,
        path: response.path,
      }))
  );

  const fetchGroups = {};
  for (const item of fetch404s) {
    const key = `${item.status} ${item.path}`;
    if (!fetchGroups[key]) fetchGroups[key] = { count: 0, pages: new Set() };
    fetchGroups[key].count += 1;
    fetchGroups[key].pages.add(item.page);
  }

  const recurringFetchNoise = Object.entries(fetchGroups)
    .map(([signature, details]) => ({
      signature,
      count: details.count,
      pageCount: details.pages.size,
    }))
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.count - a.count);

  if (recurringFetchNoise.length > 0) {
    issueList.push({
      id: "recurring-network-404-noise",
      priority: "P2",
      title: "Recurring 4xx fetch/XHR errors in console",
      evidence: {
        patternCount: recurringFetchNoise.length,
        samples: recurringFetchNoise.slice(0, 12),
      },
      acceptanceCriteria: [
        "No recurring 4xx fetch/XHR errors appear during page load of audited routes.",
        "Browser console is free from deterministic missing-resource noise in normal navigation.",
      ],
    });
  }

  const tinyTapPages = allResults
    .filter(
      (result) =>
        result.dom &&
        isTruthyNumber(result.dom.tinyTapTargets44) &&
        result.dom.tinyTapTargets44 >= 10
    )
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      tinyTapTargets44: result.dom.tinyTapTargets44,
    }));

  if (tinyTapPages.length > 0) {
    issueList.push({
      id: "touch-target-size",
      priority: "P2",
      title: "Touch targets below recommended size",
      evidence: {
        pageCount: unique(tinyTapPages.map((item) => item.page)).length,
        samples: tinyTapPages.slice(0, 12),
      },
      acceptanceCriteria: [
        "Interactive touch targets meet at least 44x44 CSS pixels on mobile-critical controls.",
        "Lighthouse/Axe touch target checks pass for key conversion flows.",
      ],
    });
  }

  const horizontalOverflow = allResults
    .filter((result) => result.dom && result.dom.hasHorizontalOverflow)
    .map((result) => ({
      page: result.page,
      viewport: result.viewport,
      scrollWidth: result.dom.scrollWidth,
      clientWidth: result.dom.clientWidth,
    }));

  if (horizontalOverflow.length > 0) {
    issueList.push({
      id: "horizontal-overflow",
      priority: "P2",
      title: "Horizontal overflow detected",
      evidence: {
        pageCount: unique(horizontalOverflow.map((item) => item.page)).length,
        samples: horizontalOverflow.slice(0, 10),
      },
      acceptanceCriteria: [
        "No audited page allows unintended horizontal scrolling at target mobile widths.",
        "Decorative/offscreen effects are clipped without widening document scroll width.",
      ],
    });
  }

  const seoChecks = payload.seoChecks;
  if (seoChecks?.enabled) {
    if (seoChecks.errors?.length > 0) {
      issueList.push({
        id: "seo-audit-execution",
        priority: "P1",
        title: "SEO/Lighthouse audit did not complete for all target pages",
        evidence: {
          errors: seoChecks.errors,
        },
        acceptanceCriteria: [
          "Lighthouse SEO/accessibility/best-practices runs complete for all target pages.",
          "SEO summary artifact contains desktop and mobile entries for each target page.",
        ],
      });
    }

    const isPagesPreview = /\.pages\.dev$/i.test(
      new URL(payload.origin).hostname
    );
    const repeatedFailedAudits = (seoChecks.pages ?? []).flatMap((page) =>
      (page.repeatedFailedAuditIds ?? [])
        .filter((auditId) => !(isPagesPreview && auditId === "is-crawlable"))
        .map((auditId) => ({
          pagePath: page.pagePath,
          auditId,
          desktopSeo: page.desktop?.seo ?? null,
          mobileSeo: page.mobile?.seo ?? null,
        }))
    );

    if (repeatedFailedAudits.length > 0) {
      issueList.push({
        id: "seo-repeated-failed-audits",
        priority: "P2",
        title: "Lighthouse reports repeated failed audits on key pages",
        evidence: {
          failures: repeatedFailedAudits,
        },
        acceptanceCriteria: [
          "Repeated Lighthouse failed audits are triaged and reduced on homepage, rooms, and help/assistance pages.",
          "Expected staging-only noindex checks are documented and excluded from blocker severity.",
        ],
      });
    }
  }

  return issueList;
}

function reportHeader(frontmatter) {
  return `---\n${frontmatter.join("\n")}\n---\n`;
}

function formatEvidence(evidence) {
  return JSON.stringify(evidence, null, 2);
}

function buildMarkdownReport(payload, issues, output) {
  const priorityBuckets = { P0: [], P1: [], P2: [] };
  for (const issue of issues) {
    if (!priorityBuckets[issue.priority]) priorityBuckets[issue.priority] = [];
    priorityBuckets[issue.priority].push(issue.id);
  }

  const summaryTableRows = issues
    .map((issue) => `| ${issue.priority} | ${issue.id} | ${issue.title} |`)
    .join("\n");

  const findings = issues
    .map((issue, index) => {
      const acceptance = issue.acceptanceCriteria
        .map((criterion) => `- [ ] ${criterion}`)
        .join("\n");
      return [
        `### ${index + 1}. [${issue.priority}] ${issue.title}`,
        "",
        `**Issue ID:** \`${issue.id}\``,
        "",
        "**Evidence**",
        "```json",
        formatEvidence(issue.evidence),
        "```",
        "",
        "**Acceptance Criteria**",
        acceptance,
      ].join("\n");
    })
    .join("\n\n");

  const noJsRouteChecks = payload.noJsChecks?.routeChecks ?? {};
  const toSummaryFlag = (value) => {
    if (typeof value !== "boolean") return "-";
    return value ? "yes" : "no";
  };
  const noJsSummaryRows = Object.entries(noJsRouteChecks)
    .map(([key, value]) => {
      const h1 = toSummaryFlag(value.checks?.hasMeaningfulH1);
      const bailoutFree = toSummaryFlag(value.checks?.hasNoBailoutMarker);
      const homeKeyLeakFree = toSummaryFlag(value.checks?.hasNoI18nKeyLeak);
      const bookingKeyLeakFree = toSummaryFlag(
        value.checks?.hasNoBookingFunnelI18nLeak
      );
      const bookingCtaFallback = toSummaryFlag(
        value.checks?.hasBookingCtaFallback
      );
      const bookingLabelVisible = toSummaryFlag(
        value.checks?.hasVisibleBookingCtaLabel
      );
      const mailtoContact = toSummaryFlag(value.checks?.hasMailtoContactLink);
      const namedSocialLinks = toSummaryFlag(value.checks?.hasNamedSocialLinks);
      const crawlableGuideLinks = toSummaryFlag(
        value.checks?.hasCrawlableGuideLinks
      );
      const roomInventoryCrawlability = toSummaryFlag(
        value.checks?.hasRoomInventoryCrawlability
      );
      const status = value.status;
      return `| ${key} | \`${value.routePath}\` | ${status} | ${h1} | ${bailoutFree} | ${homeKeyLeakFree} | ${bookingKeyLeakFree} | ${bookingCtaFallback} | ${bookingLabelVisible} | ${crawlableGuideLinks} | ${roomInventoryCrawlability} | ${mailtoContact} | ${namedSocialLinks} |`;
    })
    .join("\n");
  const bookingFlowChecks = payload.bookingTransactionChecks?.flowChecks ?? {};
  const bookingSummaryRows = Object.entries(bookingFlowChecks)
    .map(([key, value]) => {
      const hydrated = toSummaryFlag(value.checks?.hasHydratedInteraction);
      const provider = toSummaryFlag(value.checks?.hasProviderHandoff);
      const query = toSummaryFlag(value.checks?.hasRequiredBookingQuery);
      const noError = toSummaryFlag(value.checks?.hasNoExecutionError);
      const pass = toSummaryFlag(value.checks?.passes);
      const observedUrl =
        value.handoffObservedUrl || value.handoffHref || value.error || "-";
      return `| ${key} | \`${value.routePath}\` | ${hydrated} | ${provider} | ${query} | ${noError} | ${pass} | ${observedUrl} |`;
    })
    .join("\n");
  const discoveryPolicyChecks = payload.discoveryPolicyChecks ?? {};
  const discoveryPolicySummaryRows = (() => {
    const previewRequired =
      discoveryPolicyChecks.checks?.previewNoindex?.required === true
        ? "yes"
        : "no";
    const previewPass =
      discoveryPolicyChecks.checks?.previewNoindex?.passes === true
        ? "yes"
        : "no";
    const hreflangPass =
      discoveryPolicyChecks.checks?.hreflangPolicy?.passes === true
        ? "yes"
        : "no";
    const llmsPass =
      discoveryPolicyChecks.checks?.llmsTxt?.passes === true ? "yes" : "no";
    const llmsStatus = discoveryPolicyChecks.llmsTxtCheck?.status ?? "-";
    const llmsSample = String(
      discoveryPolicyChecks.llmsTxtCheck?.sample || "-"
    )
      .replace(/\s+/g, " ")
      .slice(0, 80);
    return `| ${discoveryPolicyChecks.hostname || "-"} | ${previewRequired} | ${previewPass} | ${hreflangPass} | ${llmsPass} | ${llmsStatus} | ${llmsSample || "-"} |`;
  })();

  const seoRows = (payload.seoChecks?.pages ?? [])
    .map(
      (page) =>
        `| \`${page.pagePath}\` | ${page.desktop?.seo ?? "-"} | ${page.mobile?.seo ?? "-"} | ${
          (page.repeatedFailedAuditIds ?? []).join(", ") || "none"
        } |`
    )
    .join("\n");

  const frontmatter = [
    "Type: Audit-Report",
    "Status: Draft",
    "Domain: User-Testing",
    `Target-URL: ${payload.targetUrl}`,
    `Created: ${payload.date}`,
    "Created-by: Claude (meta-user-test skill)",
    `Audit-Timestamp: ${payload.generatedAt}`,
    `Artifacts-JSON: ${output.jsonRelativePath}`,
    `Artifacts-Screenshots: ${output.screenshotsRelativeDir}`,
    ...(output.seoSummaryRelativePath
      ? [`Artifacts-SEO-Summary: ${output.seoSummaryRelativePath}`]
      : []),
    ...(output.seoArtifactsRelativeDir
      ? [`Artifacts-SEO-Raw: ${output.seoArtifactsRelativeDir}`]
      : []),
  ];

  return [
    reportHeader(frontmatter),
    `# User Testing Audit: ${payload.targetUrl}`,
    "",
    "## Coverage",
    `- Discovered internal paths: ${payload.crawl.discoveredPaths.length}`,
    `- Audited desktop pages: ${payload.desktopResults.length}`,
    `- Audited mobile pages: ${payload.mobileResults.length}`,
    `- Link checks run: ${payload.linkChecks.length}`,
    "",
    "## Priority Summary",
    `- P0 issues: ${priorityBuckets.P0.length}`,
    `- P1 issues: ${priorityBuckets.P1.length}`,
    `- P2 issues: ${priorityBuckets.P2.length}`,
    "",
    "## No-JS Predicate Summary",
    "| Route | Path | Status | Meaningful H1 | No Bailout Marker | No Home-Key Leak | No Booking-Key Leak | Booking CTA Fallback | Visible Book Now Label | Crawlable Experience Links | Crawlable Room Inventory | Home Mailto Link | Home Named Social Links |",
    "|---|---|---:|---|---|---|---|---|---|---|---|---|---|",
    noJsSummaryRows ||
      "| - | - | - | - | - | - | - | - | - | - | - | - | - |",
    "",
    "## Booking Transaction Summary",
    "| Flow | Route | Hydrated Interaction | Provider Handoff | Required Query Params | No Runtime Error | Pass | Observed Handoff |",
    "|---|---|---|---|---|---|---|---|",
    bookingSummaryRows || "| - | - | - | - | - | - | - | - |",
    "",
    "## Discovery Policy Summary",
    "| Host | Preview Noindex Required | Preview Noindex Pass | Hreflang Pass | llms.txt Pass | llms.txt Status | llms.txt Sample |",
    "|---|---|---|---|---|---:|---|",
    discoveryPolicySummaryRows || "| - | - | - | - | - | - | - |",
    "",
    "## SEO/Lighthouse Summary",
    payload.seoChecks?.enabled
      ? `- Average scores: SEO ${payload.seoChecks.averageScores?.seo ?? "-"}, accessibility ${
          payload.seoChecks.averageScores?.accessibility ?? "-"
        }, best-practices ${payload.seoChecks.averageScores?.bestPractices ?? "-"}`
      : "- SEO checks: skipped (`--skip-seo`)",
    payload.seoChecks?.errors?.length
      ? `- SEO execution errors: ${payload.seoChecks.errors.length} (see JSON artifact)`
      : "- SEO execution errors: 0",
    "| URL | Desktop SEO | Mobile SEO | Repeated Failed Audit |",
    "|---|---:|---:|---|",
    seoRows || "| - | - | - | - |",
    "",
    "## Findings Index",
    "| Priority | Issue ID | Title |",
    "|---|---|---|",
    summaryTableRows || "| - | - | No findings detected |",
    "",
    "## Detailed Findings",
    findings || "No issues were detected by the automated checks in this run.",
    "",
    "## Notes",
    "- Automated checks are deterministic but not a complete replacement for human exploratory testing.",
    "- Re-run this audit after fixes to confirm regressions are resolved.",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(args.url);
  } catch (error) {
    console.error(`Invalid URL: ${args.url}`);
    process.exitCode = 1;
    return;
  }

  if (!Number.isFinite(args.maxCrawlPages) || args.maxCrawlPages <= 0) {
    throw new Error("--max-crawl-pages must be a positive number");
  }
  if (!Number.isFinite(args.maxAuditPages) || args.maxAuditPages <= 0) {
    throw new Error("--max-audit-pages must be a positive number");
  }
  if (!Number.isFinite(args.maxMobilePages) || args.maxMobilePages <= 0) {
    throw new Error("--max-mobile-pages must be a positive number");
  }

  const date = formatDate(new Date());
  const slug = sanitizeSlug(
    args.slug || `${parsedUrl.hostname}${parsedUrl.pathname}` || "site-audit"
  );

  const startPath = `${parsedUrl.pathname || "/"}${parsedUrl.search || ""}`;
  const reportDir = args.reportDir;
  const reportBase = `${date}-${slug || "site-audit"}`;
  const jsonPath = path.join(reportDir, `${reportBase}.json`);
  const markdownPath = path.join(reportDir, `${reportBase}.md`);
  const screenshotDir = path.join(reportDir, `${reportBase}-screenshots`);
  const seoSummaryPath = path.join(reportDir, `${reportBase}-seo-summary.json`);
  const seoArtifactsDir = path.join(reportDir, `${reportBase}-seo-artifacts`);

  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(screenshotDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const crawl = await crawlInternalPaths(
      desktopContext,
      parsedUrl.origin,
      startPath,
      args
    );
    const selectedDesktopPaths = selectAuditPaths(
      startPath,
      crawl.discoveredPaths,
      args.maxAuditPages
    );

    const desktopResults = [];
    for (let index = 0; index < selectedDesktopPaths.length; index += 1) {
      const pagePath = selectedDesktopPaths[index];
      const screenshotPath =
        index < args.screenshotsPerViewport
          ? path.join(
              screenshotDir,
              `desktop-${String(index + 1).padStart(2, "0")}-${sanitizeSlug(pagePath) || "root"}.png`
            )
          : "";

      desktopResults.push(
        await auditPage(
          desktopContext,
          parsedUrl.origin,
          pagePath,
          "desktop",
          screenshotPath,
          args
        )
      );
    }

    const linkChecks = await checkInternalPaths(
      desktopContext,
      parsedUrl.origin,
      crawl.discoveredPaths.slice(0, 260)
    );
    const imageSweep = await sweepImageAssets(
      desktopContext,
      parsedUrl.origin,
      crawl.discoveredPaths
    );
    const noJsChecks = await runNoJsChecks(
      desktopContext,
      parsedUrl.origin,
      startPath,
      crawl.discoveredPaths
    );
    const bookingTransactionChecks = await runBookingTransactionChecks(
      desktopContext,
      parsedUrl.origin,
      startPath,
      crawl.discoveredPaths,
      args
    );
    const discoveryPolicyChecks = await runDiscoveryPolicyChecks(
      desktopContext,
      parsedUrl.origin,
      startPath,
      crawl.discoveredPaths
    );
    await desktopContext.close();

    const selectedMobilePaths = selectedDesktopPaths.slice(
      0,
      Math.min(args.maxMobilePages, selectedDesktopPaths.length)
    );
    const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
    const mobileResults = [];

    for (let index = 0; index < selectedMobilePaths.length; index += 1) {
      const pagePath = selectedMobilePaths[index];
      const screenshotPath =
        index < args.screenshotsPerViewport
          ? path.join(
              screenshotDir,
              `mobile-${String(index + 1).padStart(2, "0")}-${sanitizeSlug(pagePath) || "root"}.png`
            )
          : "";

      mobileResults.push(
        await auditPage(
          mobileContext,
          parsedUrl.origin,
          pagePath,
          "mobile",
          screenshotPath,
          args
        )
      );
    }

    await mobileContext.close();

    const seoChecks = await runSeoChecks({
      origin: parsedUrl.origin,
      startPath,
      discoveredPaths: crawl.discoveredPaths,
      seoArtifactsDir,
      seoEnabled: args.seoEnabled,
    });

    await fs.writeFile(
      seoSummaryPath,
      JSON.stringify(seoChecks, null, 2),
      "utf8"
    );

    const payload = {
      generatedAt: new Date().toISOString(),
      date,
      targetUrl: args.url,
      origin: parsedUrl.origin,
      startPath,
      crawl,
      selectedDesktopPaths,
      selectedMobilePaths,
      linkChecks,
      imageSweep,
      noJsChecks,
      bookingTransactionChecks,
      discoveryPolicyChecks,
      seoChecks,
      desktopResults,
      mobileResults,
    };

    const issues = aggregateFindings(payload);

    await fs.writeFile(
      jsonPath,
      JSON.stringify({ ...payload, issues }, null, 2),
      "utf8"
    );

    const markdown = buildMarkdownReport(payload, issues, {
      jsonRelativePath: path.relative(process.cwd(), jsonPath),
      screenshotsRelativeDir: path.relative(process.cwd(), screenshotDir),
      seoSummaryRelativePath: path.relative(process.cwd(), seoSummaryPath),
      seoArtifactsRelativeDir: args.seoEnabled
        ? path.relative(process.cwd(), seoArtifactsDir)
        : "",
    });

    await fs.writeFile(markdownPath, markdown, "utf8");

    console.log(`Audit complete.`);
    console.log(
      `- Markdown report: ${path.relative(process.cwd(), markdownPath)}`
    );
    console.log(`- JSON artifact:   ${path.relative(process.cwd(), jsonPath)}`);
    console.log(
      `- Screenshots:     ${path.relative(process.cwd(), screenshotDir)}`
    );
    console.log(
      `- SEO summary:     ${path.relative(process.cwd(), seoSummaryPath)}`
    );
    if (args.seoEnabled) {
      console.log(
        `- SEO raw reports: ${path.relative(process.cwd(), seoArtifactsDir)}`
      );
    }
    console.log(`- Issues found:    ${issues.length}`);
    for (const issue of issues) {
      console.log(`  - [${issue.priority}] ${issue.id}: ${issue.title}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
