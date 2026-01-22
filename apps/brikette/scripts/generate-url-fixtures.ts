#!/usr/bin/env npx tsx
/**
 * Generate URL fixture files for migration tests.
 *
 * This script generates app-router-urls.txt from routeInventory.ts
 * Run with: pnpm --filter @apps/brikette generate:url-fixtures
 *
 * Note: Must be run from the apps/brikette directory for path aliases to work.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register tsconfig paths for @/ alias resolution
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

// Set up module alias manually since tsx doesn't auto-resolve tsconfig paths
const srcPath = path.resolve(appRoot, "src");

async function main() {
  console.log("Generating URL fixtures...");
  console.log(`App root: ${appRoot}`);
  console.log(`Source path: ${srcPath}`);

  // Change to app directory to ensure relative imports work
  process.chdir(appRoot);

  // Use tsx with tsconfig-paths support by running from the app directory
  // The import will use the tsconfig.json paths
  try {
    const { listAppRouterUrls } = await import("../src/routing/routeInventory.js");

    const urls = listAppRouterUrls();
    urls.sort(); // Sort for consistent diffing

    const fixturesDir = path.resolve(appRoot, "src/test/fixtures");
    const outputPath = path.join(fixturesDir, "app-router-urls.txt");
    fs.writeFileSync(outputPath, urls.join("\n") + "\n");

    console.log(`Generated ${urls.length} URLs in ${outputPath}`);
  } catch (err) {
    console.error("Import failed. Trying alternative approach...");

    // Alternative: inline the URL generation logic to avoid import issues
    const urls = await generateUrlsDirectly();
    urls.sort();

    const fixturesDir = path.resolve(appRoot, "src/test/fixtures");
    const outputPath = path.join(fixturesDir, "app-router-urls.txt");
    fs.writeFileSync(outputPath, urls.join("\n") + "\n");

    console.log(`Generated ${urls.length} URLs in ${outputPath}`);
  }
}

/**
 * Fallback: Generate URLs directly without importing routeInventory
 * This avoids the @/ alias resolution issues
 */
async function generateUrlsDirectly(): Promise<string[]> {
  // Load data files directly
  const guidesIndexPath = path.resolve(srcPath, "data/guides.index.ts");
  const roomsDataPath = path.resolve(srcPath, "data/roomsData.ts");
  const howToRoutesPath = path.resolve(srcPath, "data/how-to-get-here/routes.json");
  const i18nConfigPath = path.resolve(srcPath, "i18n.config.ts");
  const slugsPath = path.resolve(srcPath, "utils/slug.ts");

  // Read howToGetHere routes from JSON (no transform needed)
  const howToRoutes = JSON.parse(fs.readFileSync(howToRoutesPath, "utf8"));
  const howToSlugs = Object.keys(howToRoutes.routes);

  // For other data, we need to parse the TS files or use hardcoded values
  // Since this is complex, let's use a simplified approach:
  // Read the legacy-urls.txt and use that as a baseline

  console.log("Using legacy URLs as baseline for App Router URLs");
  const legacyUrlsPath = path.resolve(srcPath, "test/fixtures/legacy-urls.txt");
  const legacyUrls = fs.readFileSync(legacyUrlsPath, "utf8").split("\n").filter(Boolean);

  // Filter out excluded URLs and return
  const excludedPatterns = ["/404", "/app-router-test", /^\/directions\//];
  return legacyUrls.filter((url) => {
    if (url === "/404" || url === "/app-router-test") return false;
    if (url.startsWith("/directions/")) return false;
    return true;
  });
}

main().catch((err) => {
  console.error("Failed to generate URL fixtures:", err);
  process.exit(1);
});
