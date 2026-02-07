#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- CLI script reads guide content from known safe paths */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";

import { guideContentSchema } from "../src/routes/guides/content-schema";
import { i18nConfig } from "../src/i18n.config";

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

type ValidationViolation = {
  file: string;
  locale: string;
  guideKey: string;
  errors: Array<{
    path: string;
    message: string;
  }>;
};

type ValidationResult = {
  total: number;
  validated: number;
  skipped: number;
  violations: ValidationViolation[];
};

/**
 * List all JSON files in a directory recursively
 */
const listJsonFiles = async (rootDir: string, relativeDir = ""): Promise<string[]> => {
  const entries = await readdir(path.join(rootDir, relativeDir), { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(nextRelative);
    }
  }

  return files.sort();
};

/**
 * Read and parse JSON file
 */
const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
};

/**
 * Validate a single guide content file
 */
const validateGuideContent = (
  content: unknown,
  guideKey: string,
  locale: string,
  relativeFile: string,
): ValidationViolation | null => {
  // Check for opt-out flag
  if (typeof content === "object" && content !== null && "_schemaValidation" in content) {
    const optOut = (content as Record<string, unknown>)._schemaValidation;
    if (optOut === false) {
      if (verbose) {
        console.log(`  ⊘ Skipped: ${relativeFile} (opt-out via _schemaValidation: false)`);
      }
      return null;
    }
  }

  const result = guideContentSchema.safeParse(content);

  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join(".") || "(root)",
      message: err.message,
    }));

    return {
      file: relativeFile,
      locale,
      guideKey,
      errors,
    };
  }

  return null;
};

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

  const result: ValidationResult = {
    total: 0,
    validated: 0,
    skipped: 0,
    violations: [],
  };

  console.log("Validating guide content...");
  console.log(`Locales: ${locales.join(", ")}`);
  if (guideFilter) {
    console.log(`Guide filter: ${Array.from(guideFilter).sort().join(", ")}`);
  }
  console.log("");

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    const guidesContentDir = path.join(localeDir, "guides", "content");

    let contentFiles: string[];
    try {
      contentFiles = await listJsonFiles(guidesContentDir);
    } catch (error) {
      if (verbose) {
        console.warn(`Warning: Could not read guides content directory for locale "${locale}"`);
      }
      continue;
    }

    for (const relativeFile of contentFiles) {
      const guideKey = path.basename(relativeFile, ".json");
      if (guideFilter && !guideFilter.has(guideKey)) {
        continue;
      }
      result.total++;
      const contentPath = path.join(guidesContentDir, relativeFile);

      try {
        const content = await readJson(contentPath);
        const violation = validateGuideContent(content, guideKey, locale, relativeFile);

        if (violation) {
          result.violations.push(violation);
        } else {
          result.validated++;
        }
      } catch (error) {
        result.violations.push({
          file: relativeFile,
          locale,
          guideKey,
          errors: [
            {
              path: "(file)",
              message: error instanceof Error ? error.message : String(error),
            },
          ],
        });
      }
    }
  }

  result.skipped = result.total - result.validated - result.violations.length;

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
