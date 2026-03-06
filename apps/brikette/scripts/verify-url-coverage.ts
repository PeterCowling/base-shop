// scripts/verify-url-coverage.ts
// Verifies that all legacy URLs are served by App Router or redirected
// Run with: pnpm --filter @apps/brikette exec ts-node --esm scripts/verify-url-coverage.ts

import fs from "node:fs";
import path from "node:path";

import { listAppRouterUrls, listLocalizedPublicUrls } from "../src/routing/routeInventory";
import {
  buildLocalizedStaticRedirectRules,
  formatRedirectRule,
} from "../src/routing/staticExportRedirects";

// Script runs from apps/brikette directory
const rootDir = process.cwd();

// URLs that are intentionally excluded from App Router (internal, deprecated, or special)
const EXCLUDED_URLS = new Set([
  "/404", // Next.js handles this via app/not-found.tsx
  "/app-router-test", // Test-only route, not needed in production
]);

const isExcludedUrl = (url: string): boolean => EXCLUDED_URLS.has(url);

function normalizeRedirectSourcePath(source: string): string | null {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    try {
      return new URL(source).pathname || "/";
    } catch {
      return null;
    }
  }
  return source.startsWith("/") ? source : null;
}

function parseRedirectSources(redirectsContent: string): string[] {
  const sources: string[] = [];

  for (const rawLine of redirectsContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const [source] = line.split(/\s+/);
    if (!source) continue;

    const normalized = normalizeRedirectSourcePath(source);
    if (!normalized) continue;
    sources.push(normalized);
  }

  return sources;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redirectSourceToRegex(source: string): RegExp {
  const pattern = escapeRegex(source)
    .replace(/\\:([A-Za-z_][A-Za-z0-9_]*)/g, "[^/]+")
    .replace(/\\\*/g, ".*");
  return new RegExp(`^${pattern}$`);
}

function buildRedirectMatchers(redirectSources: readonly string[]): RegExp[] {
  return redirectSources.map(redirectSourceToRegex);
}

const isRedirectSourceUrl = (url: string, redirectMatchers: readonly RegExp[]): boolean =>
  redirectMatchers.some((pattern) => pattern.test(url));

async function main() {
  console.info("Verifying URL coverage...\n");

  // Load legacy URLs
  const fixturesPath = path.join(rootDir, "src/test/fixtures/legacy-urls.txt");
  const legacyUrls = fs
    .readFileSync(fixturesPath, "utf8")
    .split("\n")
    .filter(Boolean);

  console.info(`Legacy URLs: ${legacyUrls.length}`);

  // Load App Router URLs
  const appRouterUrls = new Set(listAppRouterUrls());
  console.info(`App Router URLs: ${appRouterUrls.size}`);

  // Load canonical public URLs that are served via middleware rewrite / redirects.
  const localizedPublicUrls = new Set(listLocalizedPublicUrls());
  console.info(`Localized public URLs: ${localizedPublicUrls.size}`);

  // Check _redirects file exists
  const redirectsPath = path.join(rootDir, "public/_redirects");
  if (!fs.existsSync(redirectsPath)) {
    console.error("\nERROR: public/_redirects file not found");
    process.exit(1);
  }

  const redirectsContent = fs.readFileSync(redirectsPath, "utf8");
  const redirectSources = parseRedirectSources(redirectsContent);
  const redirectMatchers = buildRedirectMatchers(redirectSources);

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

  console.info(
    `Cloudflare _redirects: verified (${expectedLocalizedRules.length} localized rules)\n`,
  );

  // Find missing URLs
  const missing: string[] = [];
  const servedByAppRouter: string[] = [];
  const servedByLocalizedPublicUrl: string[] = [];
  const redirected: string[] = [];
  const excluded: string[] = [];

  for (const url of legacyUrls) {
    if (isExcludedUrl(url)) {
      excluded.push(url);
      continue;
    }

    if (appRouterUrls.has(url)) {
      servedByAppRouter.push(url);
      continue;
    }

    if (localizedPublicUrls.has(url)) {
      servedByLocalizedPublicUrl.push(url);
      continue;
    }

    if (isRedirectSourceUrl(url, redirectMatchers)) {
      redirected.push(url);
      continue;
    }

    missing.push(url);
  }

  console.info("Coverage Summary:");
  console.info(`  Served by App Router: ${servedByAppRouter.length}`);
  console.info(`  Served by localized public URL: ${servedByLocalizedPublicUrl.length}`);
  console.info(`  Redirected: ${redirected.length}`);
  console.info(`  Excluded: ${excluded.length}`);
  console.info(`  Missing: ${missing.length}`);

  if (missing.length > 0) {
    console.info("\nMissing URLs (first 30):");
    missing.slice(0, 30).forEach((url) => console.info(`  ${url}`));
    if (missing.length > 30) {
      console.info(`  ... and ${missing.length - 30} more`);
    }

    // Write full list to file for analysis
    const missingPath = path.join(rootDir, "missing-urls.txt");
    fs.writeFileSync(missingPath, missing.join("\n"));
    console.info(`\nFull list written to: ${missingPath}`);

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

  console.info("\n✓ All legacy URLs are covered!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
