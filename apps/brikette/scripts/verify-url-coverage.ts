// scripts/verify-url-coverage.ts
// Verifies that all legacy URLs are served by App Router or redirected
// Run with: pnpm --filter @apps/brikette exec ts-node --esm scripts/verify-url-coverage.ts

import fs from "node:fs";
import path from "node:path";

import { listAppRouterUrls } from "../src/routing/routeInventory";
import {
  buildLocalizedStaticRedirectRules,
  formatRedirectRule,
} from "../src/routing/staticExportRedirects";

// Script runs from apps/brikette directory
const rootDir = process.cwd();

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

async function main() {
  console.log("Verifying URL coverage...\n");

  // Load legacy URLs
  const fixturesPath = path.join(rootDir, "src/test/fixtures/legacy-urls.txt");
  const legacyUrls = fs
    .readFileSync(fixturesPath, "utf8")
    .split("\n")
    .filter(Boolean);

  console.log(`Legacy URLs: ${legacyUrls.length}`);

  // Load App Router URLs
  const appRouterUrls = new Set(listAppRouterUrls());
  console.log(`App Router URLs: ${appRouterUrls.size}`);

  // Check _redirects file exists
  const redirectsPath = path.join(rootDir, "public/_redirects");
  if (!fs.existsSync(redirectsPath)) {
    console.error("\nERROR: public/_redirects file not found");
    process.exit(1);
  }

  const redirectsContent = fs.readFileSync(redirectsPath, "utf8");
  if (!redirectsContent.includes("/directions/:slug")) {
    console.error("\nERROR: _redirects missing /directions/:slug rule");
    process.exit(1);
  }

  const expectedLocalizedRules = buildLocalizedStaticRedirectRules().map(formatRedirectRule);
  const missingLocalizedRules = expectedLocalizedRules.filter(
    (rule) => !redirectsContent.includes(rule),
  );
  if (missingLocalizedRules.length > 0) {
    console.error(
      `\nERROR: _redirects missing ${missingLocalizedRules.length} localized static-export rules`,
    );
    missingLocalizedRules.slice(0, 20).forEach((rule) => console.error(`  ${rule}`));
    process.exit(1);
  }

  console.log(
    `Cloudflare _redirects: verified (${expectedLocalizedRules.length} localized rules)\n`,
  );

  // Find missing URLs
  const missing: string[] = [];
  const served: string[] = [];
  const redirected: string[] = [];
  const excluded: string[] = [];

  for (const url of legacyUrls) {
    if (isExcludedUrl(url)) {
      excluded.push(url);
      continue;
    }

    if (appRouterUrls.has(url)) {
      served.push(url);
      continue;
    }

    if (isRedirectSourceUrl(url)) {
      redirected.push(url);
      continue;
    }

    missing.push(url);
  }

  console.log("Coverage Summary:");
  console.log(`  Served by App Router: ${served.length}`);
  console.log(`  Redirected: ${redirected.length}`);
  console.log(`  Excluded: ${excluded.length}`);
  console.log(`  Missing: ${missing.length}`);

  if (missing.length > 0) {
    console.log("\nMissing URLs (first 30):");
    missing.slice(0, 30).forEach((url) => console.log(`  ${url}`));
    if (missing.length > 30) {
      console.log(`  ... and ${missing.length - 30} more`);
    }

    // Write full list to file for analysis
    const missingPath = path.join(rootDir, "missing-urls.txt");
    fs.writeFileSync(missingPath, missing.join("\n"));
    console.log(`\nFull list written to: ${missingPath}`);

    process.exit(1);
  }

  // Check for duplicates in App Router URLs
  const urlList = listAppRouterUrls();
  if (urlList.length !== appRouterUrls.size) {
    console.error("\nERROR: App Router URLs contain duplicates");
    process.exit(1);
  }

  // Verify all App Router URLs have language prefix
  const invalidUrls = [...appRouterUrls].filter((url) => {
    const match = url.match(/^\/([a-z]{2})(\/|$)/);
    return !match;
  });

  if (invalidUrls.length > 0) {
    console.error("\nERROR: App Router URLs without language prefix:");
    invalidUrls.slice(0, 10).forEach((url) => console.error(`  ${url}`));
    process.exit(1);
  }

  console.log("\n✓ All legacy URLs are covered!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
