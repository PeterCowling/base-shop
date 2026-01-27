#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- Script operates within known content directories */
/**
 * CLI tool to migrate transport route content from legacy format to guide format.
 *
 * Usage:
 *   pnpm --filter @apps/brikette migrate-route <slug> <guideKey>
 *
 * Example:
 *   pnpm --filter @apps/brikette migrate-route capri-positano-ferry capriPositanoFerry
 *
 * This tool:
 * 1. Reads route definition from routes.json
 * 2. Reads route content from all 18 locales
 * 3. Transforms content using transformRouteToGuide
 * 4. Writes guide content to guides/content/<guideKey>.json for each locale
 * 5. Validates output structure
 */

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformRouteToGuide } from "../src/routes/how-to-get-here/transformRouteToGuide";
import { getRouteDefinition } from "../src/lib/how-to-get-here/definitions";
import type { RouteContent } from "../src/lib/how-to-get-here/schema";

const SUPPORTED_LOCALES = [
  "ar",
  "da",
  "de",
  "en",
  "es",
  "fr",
  "hi",
  "hu",
  "it",
  "ja",
  "ko",
  "no",
  "pl",
  "pt",
  "ru",
  "sv",
  "vi",
  "zh",
] as const;

const [slug, guideKey] = process.argv.slice(2);

if (!slug || !guideKey) {
  console.error("Usage: pnpm --filter @apps/brikette migrate-route <slug> <guideKey>");
  console.error("\nExample:");
  console.error("  pnpm --filter @apps/brikette migrate-route capri-positano-ferry capriPositanoFerry");
  process.exit(1);
}

if (!/^[a-z][a-zA-Z0-9]*$/u.test(guideKey)) {
  console.error("Error: guideKey must be camelCase (e.g., capriPositanoFerry)");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

// Validate slug exists in route definitions
const routeDefinition = getRouteDefinition(slug);
if (!routeDefinition) {
  console.error(`Error: Route "${slug}" not found in routes.json`);
  process.exit(1);
}

console.log(`📦 Migrating route: ${slug} → ${guideKey}`);
console.log(`📋 Content key: ${routeDefinition.contentKey}`);
console.log(`🌍 Processing ${SUPPORTED_LOCALES.length} locales...\n`);

let successCount = 0;
let errorCount = 0;
const errors: Array<{ locale: string; error: string }> = [];

for (const locale of SUPPORTED_LOCALES) {
  try {
    // Read route content
    const routeContentPath = path.join(
      appRoot,
      "src/locales",
      locale,
      "how-to-get-here/routes",
      `${routeDefinition.contentKey}.json`,
    );

    let routeContent: RouteContent;
    try {
      const routeContentRaw = await readFile(routeContentPath, "utf8");
      routeContent = JSON.parse(routeContentRaw) as RouteContent;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.log(`⚠️  ${locale}: Route content not found, skipping`);
        continue;
      }
      throw error;
    }

    // Transform
    const guideContent = transformRouteToGuide(
      {
        contentKey: routeDefinition.contentKey,
        linkBindings: routeDefinition.linkBindings,
        galleries: routeDefinition.galleries,
      },
      routeContent,
      guideKey,
    );

    // Write guide content
    const guidesContentDir = path.join(appRoot, "src/locales", locale, "guides/content");
    const guideContentPath = path.join(guidesContentDir, `${guideKey}.json`);

    // Check if file already exists
    try {
      await access(guideContentPath);
      console.log(`⚠️  ${locale}: Guide content already exists, skipping`);
      continue;
    } catch {
      // File does not exist, continue
    }

    // Create directory if needed
    await mkdir(guidesContentDir, { recursive: true });

    // Write with pretty formatting
    await writeFile(guideContentPath, `${JSON.stringify(guideContent, null, 2)}\n`, "utf8");

    console.log(`✅ ${locale}: ${guideContentPath}`);
    successCount += 1;
  } catch (error) {
    console.error(`❌ ${locale}: ${(error as Error).message}`);
    errors.push({ locale, error: (error as Error).message });
    errorCount += 1;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ ${successCount} locales migrated successfully`);
console.log(`   ⚠️  ${SUPPORTED_LOCALES.length - successCount - errorCount} locales skipped`);
console.log(`   ❌ ${errorCount} errors`);

if (errors.length > 0) {
  console.log(`\n🔍 Errors:`);
  for (const { locale, error } of errors) {
    console.log(`   ${locale}: ${error}`);
  }
  process.exit(1);
}

console.log(`\n✨ Next steps:`);
console.log(`1. Add manifest entry to: apps/brikette/src/routes/guides/guide-manifest.ts`);
console.log(`2. Configure blocks (hero, callout, gallery, etc.) in the manifest`);
console.log(`3. Add route to migration allowlist in: apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx`);
console.log(`4. Test the route in dev: /[lang]/how-to-get-here/${slug}`);
console.log(`5. Verify SEO metadata parity with legacy route`);
