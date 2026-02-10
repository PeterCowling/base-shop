#!/usr/bin/env node
/* eslint-disable no-console -- GS-001 [ttl=2026-12-31] CLI validator intentionally writes terminal output. */
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  type GuideContentValidationResult,
  validateGuideContentFiles,
} from "@acme/guides-core";

import { i18nConfig } from "../src/i18n.config";
import { guideContentSchema } from "../src/routes/guides/content-schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

// Parse CLI arguments
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const failOnViolation = args.includes("--fail-on-violation");
const localeFilter = args.find(arg => arg.startsWith("--locale="))?.slice("--locale=".length);
const guideFilterArg = args.find(arg => arg.startsWith("--guides="))?.slice("--guides=".length);
const guideFilter = guideFilterArg
  ? new Set(
      guideFilterArg
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean),
    )
  : null;

/**
 * Main validation function
 */
const main = async (): Promise<void> => {
  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  const locales = localeFilter
    ? supportedLocales.filter(loc => loc === localeFilter)
    : supportedLocales;

  if (localeFilter && locales.length === 0) {
    console.error(`Error: Locale "${localeFilter}" not found in supported locales.`);
    process.exit(1);
  }

  console.log("Validating guide content...");
  console.log(`Locales: ${locales.join(", ")}`);
  if (guideFilter) {
    console.log(`Guide filter: ${Array.from(guideFilter).sort().join(", ")}`);
  }
  console.log("");

  const result: GuideContentValidationResult = await validateGuideContentFiles({
    schemaValidator: guideContentSchema,
    localesRoot: LOCALES_ROOT,
    locales,
    guideFilter,
    onSkippedFile: verbose
      ? ({ relativeFile }) => {
          console.log(`  ⊘ Skipped: ${relativeFile} (opt-out via _schemaValidation: false)`);
        }
      : undefined,
    onMissingLocaleContentDir: verbose
      ? locale => {
          console.warn(`Warning: Could not read guides content directory for locale "${locale}"`);
        }
      : undefined,
  });

  // Report results
  console.log("Validation Summary:");
  console.log(`  Total files: ${result.total}`);
  console.log(`  Validated: ${result.validated}`);
  console.log(`  Skipped: ${result.skipped}`);
  console.log(`  Violations: ${result.violations.length}`);
  console.log("");

  if (result.violations.length > 0) {
    console.log("Violations found:");
    console.log("");

    for (const violation of result.violations) {
      console.log(`  ${violation.locale}/guides/content/${violation.file}`);
      for (const error of violation.errors) {
        console.log(`    - ${error.path}: ${error.message}`);
      }
      console.log("");
    }

    if (failOnViolation) {
      console.error("Validation failed due to violations.");
      process.exitCode = 1;
    } else {
      console.log("Note: Violations found, but not failing build (warning mode).");
      console.log("Use --fail-on-violation to fail on violations.");
    }
  } else {
    console.log("✅ All guide content validated successfully!");
  }
};

main().catch((error) => {
  console.error("Fatal error during validation:");
  console.error(error);
  process.exitCode = 1;
});
