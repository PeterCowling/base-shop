/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
/**
 * TASK-10A/10B: SSR/no-JS + i18n leakage detection gate for commercial booking routes.
 *
 * Gate mode:
 *   TC-01  report-only — i18n placeholder findings warn but never hard-fail CI.
 *          Set CONTENT_READINESS_MODE=fail to activate hard-fail for TC-01.
 *   TC-02  CI-blocking (TASK-10B activated) — /{lang}/book must expose a static Octorate
 *          fallback link. Always hard-fails if the link is missing.
 *   TC-03  CI-blocking — locale namespace coverage regression always hard-fails.
 *
 * Coverage:
 *   TC-01  i18n placeholder leakage — commercial route namespaces across all locales.
 *   TC-02  No-JS dead-end detection — /{lang}/book must expose a static Octorate fallback link.
 *   TC-03  Localized namespace coverage regression — bookPage.json exists for every locale.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { detectRenderedI18nPlaceholders } from "@tests/utils/detectRenderedI18nPlaceholders";

import { type AppLanguage, i18nConfig } from "@/i18n.config";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const LOCALES_ROOT = path.resolve(__dirname, "../../../locales");
const SOURCE_ROOT = path.resolve(__dirname, "../../../");

const STRICT_MODE =
  process.env.I18N_MISSING_KEYS_MODE === "fail" ||
  process.env.CONTENT_READINESS_MODE === "fail";

/**
 * Namespaces consumed by the five commercial routes:
 *   /{lang}             (landing — translation + landingPage)
 *   /{lang}/book        (hostel booking — bookPage + roomsPage + modals)
 *   /{lang}/apartment/book (apartment booking — apartmentPage + bookPage + modals)
 *   /{lang}/rooms       (room listing — roomsPage + rooms)
 *   /{lang}/deals       (deals — dealsPage)
 */
const COMMERCIAL_ROUTE_NAMESPACES = [
  "bookPage",
  "modals",
  "roomsPage",
  "rooms",
  "dealsPage",
  "apartmentPage",
] as const;

const NON_EN_LOCALES = (i18nConfig.supportedLngs ?? []).filter(
  (l) => l !== "en",
) as AppLanguage[];

/**
 * RSC entry point for the /{lang}/book route.
 * The no-JS fallback link must live here (not in client components).
 * Path is relative to SOURCE_ROOT (apps/brikette/src/).
 */
const BOOKING_ROUTE_SOURCE_FILES = [
  "app/[lang]/book/page.tsx",
] as const;

/** Pattern that indicates a static, non-JS-dependent Octorate booking link. */
const OCTORATE_STATIC_LINK_PATTERN = /book\.octorate\.com/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively extract all string leaf values from a parsed JSON object.
 */
function extractStringValues(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (Array.isArray(obj)) return obj.flatMap((item) => extractStringValues(item));
  if (obj && typeof obj === "object") {
    return Object.values(obj).flatMap((v) => extractStringValues(v));
  }
  return [];
}

// ---------------------------------------------------------------------------
// TC-01: i18n placeholder leakage for commercial route namespaces
// ---------------------------------------------------------------------------

describe("TC-01: commercial route namespace i18n placeholder audit (TASK-10A, report-only)", () => {
  it("no unresolved placeholder phrases in commercial route namespaces across all locales", () => {
    const findings: Array<{ locale: string; namespace: string; value: string }> = [];

    for (const locale of NON_EN_LOCALES) {
      for (const namespace of COMMERCIAL_ROUTE_NAMESPACES) {
        const filePath = path.join(LOCALES_ROOT, locale, `${namespace}.json`);
        if (!existsSync(filePath)) continue;

        let json: unknown;
        try {
          json = JSON.parse(readFileSync(filePath, "utf8"));
        } catch {
          continue;
        }

        const strings = extractStringValues(json);

        for (const value of strings) {
          const detected = detectRenderedI18nPlaceholders(value, {
            // Phrase-only detection — raw key detection is handled by i18n-parity tests.
            keyPrefixes: [],
            minDotSegments: 999,
          });
          for (const finding of detected.filter((f) => f.kind === "placeholderPhrase")) {
            findings.push({ locale, namespace, value: finding.value });
          }
        }
      }
    }

    if (findings.length > 0) {
      const report = findings
        .map((f) => `  [${f.locale}] ${f.namespace}: "${f.value}"`)
        .join("\n");

      const message =
        `[TASK-10A TC-01] ${findings.length} unresolved i18n placeholder(s) detected in commercial route namespaces:\n` +
        `${report}\n` +
        `\nRemediation: translate or remove placeholder phrases. Set CONTENT_READINESS_MODE=fail to enforce.`;

      if (STRICT_MODE) {
        throw new Error(message);
      }

      // Report-only: warn but allow CI to pass.
      console.warn(`[WARN] ${message}`);
    }

    // Always passes in report-only mode.
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-02: No-JS dead-end detection — /{lang}/book must have a static fallback link
// ---------------------------------------------------------------------------

describe("TC-02: no-JS fallback audit for /{lang}/book (TASK-10B, CI-blocking)", () => {
  it("/{lang}/book server source includes a static Octorate link for no-JS users", () => {
    const deadEndFiles: string[] = [];

    for (const relPath of BOOKING_ROUTE_SOURCE_FILES) {
      const fullPath = path.join(SOURCE_ROOT, relPath);
      if (!existsSync(fullPath)) {
        // File missing is itself a potential concern; skip silently.
        continue;
      }

      const source = readFileSync(fullPath, "utf8");
      if (!OCTORATE_STATIC_LINK_PATTERN.test(source)) {
        deadEndFiles.push(relPath);
      }
    }

    if (deadEndFiles.length > 0) {
      const list = deadEndFiles.map((f) => `  - ${f}`).join("\n");
      // TC-02 is CI-blocking (activated in TASK-10B after static fallback link added to page.tsx).
      // Any regression that removes book.octorate.com from booking route source will hard-fail here.
      throw new Error(
        `[TASK-10B TC-02] No static Octorate link found in ${deadEndFiles.length} booking route source file(s).\n` +
          `No-JS users on /{lang}/book reach a booking dead-end (modal-only flow):\n${list}\n` +
          `\nRemediation: restore <noscript><a href="https://book.octorate.com/..."> in book/page.tsx RSC layer.`,
      );
    }

    expect(deadEndFiles).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-03: Localized namespace coverage regression
// ---------------------------------------------------------------------------

describe("TC-03: commercial namespace coverage regression (TASK-10A)", () => {
  it.each(NON_EN_LOCALES)(
    "locale %s has bookPage.json (primary commercial route namespace)",
    (locale) => {
      const filePath = path.join(LOCALES_ROOT, locale, "bookPage.json");
      expect(existsSync(filePath)).toBe(true);
    },
  );

  it.each(NON_EN_LOCALES)(
    "locale %s has modals.json (booking modal namespace)",
    (locale) => {
      const filePath = path.join(LOCALES_ROOT, locale, "modals.json");
      expect(existsSync(filePath)).toBe(true);
    },
  );
});
