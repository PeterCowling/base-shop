import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildStaticRuntimeArtifacts } from "./lib/static-runtime-redirects";

const rootDir = process.cwd();
const redirectsPath = path.join(rootDir, "public/_redirects");
const routesPath = path.join(rootDir, "public/_routes.json");
const legacyRedirectsModulePath = path.join(rootDir, "functions/generated/legacy-redirects.js");
const EXCLUDED_URLS = new Set(["/404", "/app-router-test"]);

function normalizeRedirectSourcePath(source: string): string | null {
  if (source.startsWith("http://") || source.startsWith("https://")) return null;

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

function routePatternToRegex(routePattern: string): RegExp {
  return new RegExp(`^${escapeRegex(routePattern).replace(/\\\*/g, ".*")}$`);
}

function buildRedirectMatchers(redirectSources: readonly string[]): RegExp[] {
  return redirectSources.map((source) =>
    new RegExp(
      `^${escapeRegex(source)
        .replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, "[^/]+")
        .replace(/\\\*/g, ".*")}$`,
    ),
  );
}

async function loadGeneratedLegacyRedirectEntries(): Promise<[string, string][]> {
  const moduleUrl = pathToFileURL(legacyRedirectsModulePath).href;
  const imported = await import(moduleUrl);
  return imported.LEGACY_REDIRECT_ENTRIES as [string, string][];
}

async function main() {
  console.info("Verifying static runtime URL coverage...\n");

  if (!fs.existsSync(redirectsPath)) {
    console.error("\nERROR: public/_redirects file not found");
    process.exit(1);
  }
  if (!fs.existsSync(routesPath)) {
    console.error("\nERROR: public/_routes.json file not found");
    process.exit(1);
  }
  if (!fs.existsSync(legacyRedirectsModulePath)) {
    console.error("\nERROR: functions/generated/legacy-redirects.js file not found");
    process.exit(1);
  }

  const artifacts = buildStaticRuntimeArtifacts(rootDir);
  const redirectsContent = fs.readFileSync(redirectsPath, "utf8");
  const redirectSources = parseRedirectSources(redirectsContent);
  const redirectMatchers = buildRedirectMatchers(redirectSources);
  const actualRouteConfig = JSON.parse(fs.readFileSync(routesPath, "utf8")) as {
    version: number;
    include: string[];
    exclude?: string[];
  };
  const generatedLegacyEntries = await loadGeneratedLegacyRedirectEntries();

  const expectedStructuralRules = artifacts.structuralRules.map((rule) => `${rule.from}  ${rule.to}  ${rule.status}`);
  const missingStructuralRules = expectedStructuralRules.filter((rule) => !redirectsContent.includes(rule));
  if (missingStructuralRules.length > 0) {
    console.error(`\nERROR: _redirects missing ${missingStructuralRules.length} structural rules`);
    missingStructuralRules.slice(0, 20).forEach((rule) => console.error(`  ${rule}`));
    process.exit(1);
  }

  const redirectRuleCount = redirectSources.length;
  if (redirectRuleCount > 2000) {
    console.error(`\nERROR: _redirects has ${redirectRuleCount} rules; Cloudflare Pages limit is 2000 static rules`);
    process.exit(1);
  }

  const expectedRouteConfig = artifacts.routeConfig;
  const actualInclude = [...(actualRouteConfig.include ?? [])].sort();
  const actualExclude = [...(actualRouteConfig.exclude ?? [])].sort();
  if (
    actualRouteConfig.version !== expectedRouteConfig.version ||
    JSON.stringify(actualInclude) !== JSON.stringify(expectedRouteConfig.include) ||
    JSON.stringify(actualExclude) !== JSON.stringify(expectedRouteConfig.exclude)
  ) {
    console.error("\nERROR: public/_routes.json does not match generated legacy function scope");
    process.exit(1);
  }

  const routeRuleCount = actualInclude.length + actualExclude.length;
  if (routeRuleCount > 100) {
    console.error(`\nERROR: _routes.json uses ${routeRuleCount} rules; Cloudflare limit is 100 combined include/exclude rules`);
    process.exit(1);
  }

  const routeMatchers = actualInclude.map(routePatternToRegex);
  const uncoveredLegacyFunctionSources = artifacts.exactLegacyRedirects
    .map((entry) => entry.from)
    .filter((source) => !routeMatchers.some((matcher) => matcher.test(source)));
  if (uncoveredLegacyFunctionSources.length > 0) {
    console.error(
      `\nERROR: _routes.json does not cover ${uncoveredLegacyFunctionSources.length} legacy redirect sources`,
    );
    uncoveredLegacyFunctionSources.slice(0, 20).forEach((source) => console.error(`  ${source}`));
    process.exit(1);
  }

  const expectedLegacyEntries = artifacts.exactLegacyRedirects.map(({ from, to }) => [from, to]);
  if (JSON.stringify(generatedLegacyEntries) !== JSON.stringify(expectedLegacyEntries)) {
    console.error("\nERROR: generated legacy redirect module is out of sync with the fixture-backed manifest");
    process.exit(1);
  }

  console.info(`Historical legacy URLs: ${artifacts.legacyUrls.length}`);
  console.info(`Localized canonicals: ${artifacts.canonicalUrls.length}`);
  console.info(`Structural _redirects rules: ${redirectSources.length}`);
  console.info(`Exact legacy redirects: ${artifacts.exactLegacyRedirects.length}`);
  console.info(`Pages Function include rules: ${actualInclude.length}\n`);

  const missing: string[] = [];
  const canonical: string[] = [];
  const redirectedByStructural: string[] = [];
  const redirectedByFunction: string[] = [];

  const canonicalUrlSet = new Set(artifacts.canonicalUrls);
  const exactLegacySources = new Set(artifacts.exactLegacyRedirects.map((entry) => entry.from));

  for (const url of artifacts.legacyUrls) {
    if (EXCLUDED_URLS.has(url)) {
      continue;
    }

    if (canonicalUrlSet.has(url)) {
      canonical.push(url);
      continue;
    }

    if (redirectMatchers.some((pattern) => pattern.test(url))) {
      redirectedByStructural.push(url);
      continue;
    }

    if (exactLegacySources.has(url)) {
      redirectedByFunction.push(url);
      continue;
    }

    missing.push(url);
  }

  console.info("Coverage Summary:");
  console.info(`  Canonical: ${canonical.length}`);
  console.info(`  Structural redirects: ${redirectedByStructural.length}`);
  console.info(`  Function redirects: ${redirectedByFunction.length}`);
  console.info(`  Missing: ${missing.length}`);

  if (missing.length > 0) {
    const missingPath = path.join(rootDir, "missing-urls.txt");
    fs.writeFileSync(missingPath, missing.join("\n"));
    console.info("\nMissing URLs (first 30):");
    missing.slice(0, 30).forEach((url) => console.info(`  ${url}`));
    console.info(`\nFull list written to: ${missingPath}`);
    process.exit(1);
  }

  console.info("\n✓ All supported legacy URLs are covered by the static Pages runtime.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
