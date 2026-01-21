// src/test/migration/url-inventory.test.ts
// Verifies that all legacy URLs are served by App Router or redirected
// This test does NOT depend on src/compat/* - uses routeInventory.ts instead
import fs from "node:fs";
import path from "node:path";

import { listAppRouterUrls } from "../../routing/routeInventory";

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

describe("URL inventory", () => {
  const fixturesPath = path.join(__dirname, "../fixtures/legacy-urls.txt");
  const legacyUrls = fs
    .readFileSync(fixturesPath, "utf8")
    .split("\n")
    .filter(Boolean);

  const appRouterUrls = new Set(listAppRouterUrls());

  it("legacy URL fixture exists and has content", () => {
    expect(legacyUrls.length).toBeGreaterThan(0);
  });

  it("App Router URL inventory has content", () => {
    expect(appRouterUrls.size).toBeGreaterThan(0);
  });

  it("all legacy URLs have App Router equivalents or redirects", () => {
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

  it("App Router URLs are unique (no duplicates)", () => {
    const urlList = listAppRouterUrls();
    const uniqueUrls = new Set(urlList);
    expect(urlList.length).toBe(uniqueUrls.size);
  });

  it("all App Router URLs start with a language prefix", () => {
    const invalidUrls = [...appRouterUrls].filter((url) => {
      // Valid URLs should start with /:lang where lang is 2 chars
      const match = url.match(/^\/([a-z]{2})(\/|$)/);
      return !match;
    });

    expect(invalidUrls).toEqual([]);
  });
});
