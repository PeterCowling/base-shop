/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] CLI audit reads locale JSON files from the app workspace. */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");
const BASELINE_LOCALE = "en";

const args = new Set(process.argv.slice(2));
const verbose = args.has("--verbose");
const failOnMissing = args.has("--fail-on-missing");
const maxListItems = verbose ? Number.POSITIVE_INFINITY : 10;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

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

const readJson = async (filePath: string): Promise<unknown> => {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as unknown;
};

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

const main = async (): Promise<void> => {
  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  const locales = supportedLocales.filter((locale) => locale !== BASELINE_LOCALE);

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

  console.log(`i18n coverage (baseline: ${BASELINE_LOCALE})`);
  console.log(`Locales: ${[BASELINE_LOCALE, ...locales].join(", ")}`);

  let totalMissingFiles = 0;
  let totalMissingKeys = 0;

  for (const report of reports) {
    const missingKeysEntries = Object.entries(report.missingKeys);
    const missingKeyCount = missingKeysEntries.reduce((sum, [, keys]) => sum + keys.length, 0);
    totalMissingFiles += report.missingFiles.length;
    totalMissingKeys += missingKeyCount;

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

  if (failOnMissing && (totalMissingFiles > 0 || totalMissingKeys > 0)) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
