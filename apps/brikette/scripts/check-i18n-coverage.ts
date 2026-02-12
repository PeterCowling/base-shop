/* eslint-disable no-console, complexity, max-depth, security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] CLI audit script intentionally logs and traverses workspace JSON trees. */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  listJsonFiles,
  readJson,
} from "@acme/guides-core";

import { i18nConfig } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const BASELINE_LOCALE = "en";

// Parse CLI arguments
const rawArgs = process.argv.slice(2);
const args = new Set(
  rawArgs.filter(
    (arg) =>
      !arg.startsWith("--output=") &&
      !arg.startsWith("--locales-root=") &&
      !arg.startsWith("--locales="),
  ),
);
const verbose = args.has("--verbose");
const failOnMissing = args.has("--fail-on-missing");
const jsonOutput = args.has("--json");
const maxListItems = verbose ? Number.POSITIVE_INFINITY : 10;

// Optional: override locales root for fixtures / alternate worktrees
const localesRootArg = rawArgs.find((arg) => arg.startsWith("--locales-root="));
const localesRootOverride = localesRootArg
  ? localesRootArg.slice("--locales-root=".length)
  : undefined;
const LOCALES_ROOT = localesRootOverride
  ? path.resolve(APP_ROOT, localesRootOverride)
  : path.join(APP_ROOT, "src", "locales");

// Optional: override which locales are audited (comma-separated, excluding baseline)
const localesArg = rawArgs.find((arg) => arg.startsWith("--locales="));
const localesOverrideRaw = localesArg
  ? localesArg.slice("--locales=".length)
  : undefined;

// Parse --output=<path> argument
const outputArg = rawArgs.find((arg) => arg.startsWith("--output="));
const outputPath = outputArg ? outputArg.slice("--output=".length) : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const collectMissingKeys = (
  base: unknown,
  target: unknown,
  prefix: string,
  missing: string[],
): void => {
  if (!isRecord(base)) return;
  const targetRecord = isRecord(target) ? target : undefined;

  for (const [key, value] of Object.entries(base)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (!targetRecord || !(key in targetRecord)) {
      missing.push(pathKey);
      continue;
    }
    const targetValue = targetRecord[key];
    if (isRecord(value)) {
      if (!isRecord(targetValue)) {
        missing.push(pathKey);
        continue;
      }
      collectMissingKeys(value, targetValue, pathKey, missing);
    }
  }
};

const formatList = (items: string[], maxItems: number): { shown: string[]; remaining: number } => {
  if (items.length <= maxItems) {
    return { shown: items, remaining: 0 };
  }
  return { shown: items.slice(0, maxItems), remaining: items.length - maxItems };
};

type LocaleReport = {
  locale: string;
  missingFiles: string[];
  missingKeys: Record<string, string[]>;
};

/**
 * JSON output schema (v1)
 * @see docs/plans/i18n-missing-key-detection-plan.md
 */
type CoverageReportJson = {
  schemaVersion: 1;
  baselineLocale: string;
  locales: string[];
  summary: {
    totalMissingFiles: number;
    totalMissingKeys: number;
  };
  reports: LocaleReport[];
};

const main = async (): Promise<void> => {
  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  const locales = localesOverrideRaw
    ? localesOverrideRaw
        .split(",")
        .map((locale) => locale.trim())
        .filter(Boolean)
        .filter((locale, index, all) => all.indexOf(locale) === index)
        .filter((locale) => locale !== BASELINE_LOCALE)
    : supportedLocales.filter((locale) => locale !== BASELINE_LOCALE);

  const baselineDir = path.join(LOCALES_ROOT, BASELINE_LOCALE);
  const baselineFiles = await listJsonFiles(baselineDir);

  const reports: LocaleReport[] = [];

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    const missingFiles: string[] = [];
    const missingKeys: Record<string, string[]> = {};

    for (const relativeFile of baselineFiles) {
      const baselinePath = path.join(baselineDir, relativeFile);
      const localePath = path.join(localeDir, relativeFile);

      try {
        await readFile(localePath, "utf8");
      } catch {
        missingFiles.push(relativeFile);
        continue;
      }

      try {
        const baseJson = await readJson(baselinePath);
        const localeJson = await readJson(localePath);
        const missing: string[] = [];
        collectMissingKeys(baseJson, localeJson, "", missing);
        if (missing.length > 0) {
          missingKeys[relativeFile] = missing.sort();
        }
      } catch (error) {
        missingKeys[relativeFile] = [
          `__parse_error__: ${(error as Error).message}`,
        ];
      }
    }

    reports.push({ locale, missingFiles, missingKeys });
  }

  // Calculate totals
  let totalMissingFiles = 0;
  let totalMissingKeys = 0;

  for (const report of reports) {
    const missingKeysEntries = Object.entries(report.missingKeys);
    const missingKeyCount = missingKeysEntries.reduce((sum, [, keys]) => sum + keys.length, 0);
    totalMissingFiles += report.missingFiles.length;
    totalMissingKeys += missingKeyCount;
  }

  // Handle JSON output mode
  if (jsonOutput) {
    const jsonReport: CoverageReportJson = {
      schemaVersion: 1,
      baselineLocale: BASELINE_LOCALE,
      locales,
      summary: {
        totalMissingFiles,
        totalMissingKeys,
      },
      reports,
    };

    const jsonString = JSON.stringify(jsonReport, null, 2);

    if (outputPath) {
      // Write to file and print summary to stdout
      const outputDir = path.dirname(outputPath);
      await mkdir(outputDir, { recursive: true });
      await writeFile(outputPath, jsonString, "utf8");
      console.log(`i18n coverage report written to: ${outputPath}`);
      console.log(`Summary: ${totalMissingFiles} missing files, ${totalMissingKeys} missing keys`);
    } else {
      // Print JSON to stdout
      console.log(jsonString);
    }
  } else {
    // Text output mode (original behavior)
    console.log(`i18n coverage (baseline: ${BASELINE_LOCALE})`);
    console.log(`Locales: ${[BASELINE_LOCALE, ...locales].join(", ")}`);

    for (const report of reports) {
      const missingKeysEntries = Object.entries(report.missingKeys);
      const missingKeyCount = missingKeysEntries.reduce((sum, [, keys]) => sum + keys.length, 0);

      console.log("");
      console.log(`${report.locale}:`);
      console.log(`  Missing files: ${report.missingFiles.length}`);
      if (report.missingFiles.length > 0) {
        const { shown, remaining } = formatList(report.missingFiles, maxListItems);
        for (const file of shown) {
          console.log(`    - ${file}`);
        }
        if (remaining > 0) {
          console.log(`    ... +${remaining} more`);
        }
      }

      console.log(`  Missing keys: ${missingKeyCount}`);
      if (missingKeysEntries.length > 0) {
        for (const [file, keys] of missingKeysEntries) {
          console.log(`    - ${file}: ${keys.length}`);
          if (verbose) {
            const { shown, remaining } = formatList(keys, maxListItems);
            for (const key of shown) {
              console.log(`      - ${key}`);
            }
            if (remaining > 0) {
              console.log(`      ... +${remaining} more`);
            }
          }
        }
        if (!verbose) {
          console.log("  (run with --verbose for per-key details)");
        }
      }
    }

    console.log("");
    console.log(`Total missing files: ${totalMissingFiles}`);
    console.log(`Total missing keys: ${totalMissingKeys}`);
  }

  if (failOnMissing && (totalMissingFiles > 0 || totalMissingKeys > 0)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
