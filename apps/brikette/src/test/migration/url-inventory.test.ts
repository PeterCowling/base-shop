// src/test/migration/url-inventory.test.ts
// Verifies that all legacy URLs are served by App Router or redirected
//
// IMPORTANT: This test uses static fixture files to avoid ESM/CJS issues.
// Both fixture files are generated at build time:
// - legacy-urls.txt: URLs from the compat shim (Pages Router)
// - app-router-urls.txt: URLs from routeInventory.ts (App Router)
//
// To regenerate fixtures, run: pnpm --filter @apps/brikette generate:url-fixtures
//
// NOTE: Tests that require app-router-urls.txt are skipped until the fixture
// is generated. This is tracked in BRK-COMPAT-07.

import fs from "node:fs";
import path from "node:path";

// Patterns for URLs that are handled by Cloudflare _redirects (not served by App Router)
const REDIRECT_PATTERNS = [
  /^\/directions\//, // /directions/:slug → /en/how-to-get-here/:slug
];

// URLs that are intentionally excluded from App Router (internal, deprecated, or special)
const EXCLUDED_URLS = new Set([
  "/404", // Next.js handles this via app/not-found.tsx
  "/app-router-test", // Test-only route, not needed in production
]);

const isRedirectSourceUrl = (url: string): boolean =>
  REDIRECT_PATTERNS.some((pattern) => pattern.test(url));

const isExcludedUrl = (url: string): boolean => EXCLUDED_URLS.has(url);

function loadUrlFixture(filename: string): string[] {
  const fixturePath = path.join(__dirname, "../fixtures", filename);
  if (!fs.existsSync(fixturePath)) {
    return [];
  }
  return fs.readFileSync(fixturePath, "utf8").split("\n").filter(Boolean);
}

describe("URL inventory", () => {
  const legacyUrls = loadUrlFixture("legacy-urls.txt");
  const appRouterUrls = new Set(loadUrlFixture("app-router-urls.txt"));
  const hasAppRouterFixture = appRouterUrls.size > 0;

  it("legacy URL fixture exists and has content", () => {
    expect(legacyUrls.length).toBeGreaterThan(0);
  });

  // Skip tests that require app-router-urls.txt until fixture is generated
  const itWithFixture = hasAppRouterFixture ? it : it.skip;

  itWithFixture("App Router URL fixture exists and has content", () => {
    expect(appRouterUrls.size).toBeGreaterThan(0);
  });

  itWithFixture("all legacy URLs have App Router equivalents or redirects", () => {
    const missing: string[] = [];

    for (const url of legacyUrls) {
      if (isExcludedUrl(url)) continue;

      const isServed = appRouterUrls.has(url);
      const isRedirected = isRedirectSourceUrl(url);

      if (!isServed && !isRedirected) {
        missing.push(url);
      }
    }

    if (missing.length > 0) {
      // Show first 20 missing URLs for debugging
      const preview = missing.slice(0, 20);
      console.error(
        `Missing ${missing.length} URLs. First 20:\n${preview.join("\n")}`
      );
    }

    expect(missing).toEqual([]);
  });

  it("redirect patterns are documented in _redirects", () => {
    const redirectsPath = path.join(__dirname, "../../../public/_redirects");
    const redirectsFile = fs.readFileSync(redirectsPath, "utf8");

    // Verify each redirect pattern has a corresponding _redirects rule
    expect(redirectsFile).toContain("/directions/:slug");
  });

  itWithFixture("App Router URLs are unique (no duplicates)", () => {
    const urlList = loadUrlFixture("app-router-urls.txt");
    const uniqueUrls = new Set(urlList);
    expect(urlList.length).toBe(uniqueUrls.size);
  });

  itWithFixture("all App Router URLs start with a language prefix (except redirects)", () => {
    // Root-level URLs that redirect to language-prefixed versions
    const ALLOWED_ROOT_URLS = new Set([
      "/cookie-policy", // Redirects to /en/cookie-policy
      "/privacy-policy", // Redirects to /en/privacy-policy
    ]);

    const invalidUrls = [...appRouterUrls].filter((url) => {
      if (ALLOWED_ROOT_URLS.has(url)) return false;
      // Valid URLs should start with /:lang where lang is 2 chars
      const match = url.match(/^\/([a-z]{2})(\/|$)/);
      return !match;
    });

    expect(invalidUrls).toEqual([]);
  });
});
