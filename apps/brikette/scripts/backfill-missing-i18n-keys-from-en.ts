#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- CLI backfills locale JSON keys from repo-local src/locales. */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");
const DEFAULT_BASELINE_LOCALE = "en";

type Args = {
  baselineLocale: string;
  localesRoot: string;
  locales?: string[];
  files?: string[];
  dryRun: boolean;
};

const parseArgs = (): Args => {
  const rawArgs = process.argv.slice(2);

  const baselineLocale =
    rawArgs.find((arg) => arg.startsWith("--baseline="))?.slice("--baseline=".length) ??
    DEFAULT_BASELINE_LOCALE;

  const localesRoot =
    rawArgs.find((arg) => arg.startsWith("--locales-root="))?.slice("--locales-root=".length) ??
    DEFAULT_LOCALES_ROOT;

  const localesRaw = rawArgs
    .find((arg) => arg.startsWith("--locales="))
    ?.slice("--locales=".length);
  const locales = localesRaw
    ? localesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : undefined;

  const filesRaw = rawArgs.find((arg) => arg.startsWith("--files="))?.slice("--files=".length);
  const files = filesRaw
    ? filesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : undefined;

  const dryRun = rawArgs.includes("--dry-run");

  return {
    baselineLocale,
    localesRoot: path.isAbsolute(localesRoot) ? localesRoot : path.resolve(APP_ROOT, localesRoot),
    locales,
    files,
    dryRun,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const deepCloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const readJson = async (absolutePath: string): Promise<unknown> => {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const collectMissingOrMismatched = (
  baseline: unknown,
  target: unknown,
  prefix: string,
  missing: string[],
): void => {
  if (isRecord(baseline)) {
    if (!isRecord(target)) {
      missing.push(prefix || "__root__");
      return;
    }
    for (const [key, baselineValue] of Object.entries(baseline)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (!(key in target)) {
        missing.push(nextPrefix);
        continue;
      }
      collectMissingOrMismatched(baselineValue, target[key], nextPrefix, missing);
    }
    return;
  }

  if (Array.isArray(baseline)) {
    if (!Array.isArray(target)) {
      missing.push(prefix || "__root__");
    }
    return;
  }

  if (baseline === null) {
    if (target !== null) {
      missing.push(prefix || "__root__");
    }
    return;
  }

  if (typeof baseline !== "object") {
    if (typeof target !== typeof baseline) {
      missing.push(prefix || "__root__");
    }
  }
};

const mergeFromBaseline = (baseline: unknown, target: unknown): unknown => {
  if (isRecord(baseline)) {
    const targetRecord = isRecord(target) ? target : {};
    const merged: Record<string, unknown> = {};

    for (const [key, baselineValue] of Object.entries(baseline)) {
      if (key in targetRecord) {
        merged[key] = mergeFromBaseline(baselineValue, targetRecord[key]);
      } else {
        merged[key] = deepCloneJson(baselineValue);
      }
    }

    for (const [key, targetValue] of Object.entries(targetRecord)) {
      if (key in (baseline as Record<string, unknown>)) continue;
      merged[key] = targetValue;
    }

    return merged;
  }

  if (Array.isArray(baseline)) {
    return Array.isArray(target) ? target : deepCloneJson(baseline);
  }

  if (baseline === null) {
    return target === null ? target : null;
  }

  if (typeof baseline !== "object") {
    return typeof target === typeof baseline ? target : deepCloneJson(baseline);
  }

  return deepCloneJson(baseline);
};

const main = async (): Promise<void> => {
  const { baselineLocale, localesRoot, locales: localesOverride, files, dryRun } = parseArgs();

  const supportedLocales = (i18nConfig.supportedLngs ?? []) as string[];
  const locales =
    localesOverride ??
    supportedLocales
      .filter((locale) => locale !== baselineLocale)
      .filter((locale, index, all) => all.indexOf(locale) === index);

  if (locales.length === 0) {
    console.log("No locales selected (nothing to do).");
    return;
  }

  const baselineDir = path.join(localesRoot, baselineLocale);
  const relativeFiles = files?.length
    ? files.map((f) => f.replace(/^\//, "")).sort()
    : [];

  if (relativeFiles.length === 0) {
    throw new Error(
      [
        "Missing required --files=... argument.",
        "This CLI intentionally requires explicit scoping to avoid accidental mass backfills.",
        'Example: --files="assistanceSection.json,guides/content/travelHelp.json"',
      ].join("\n"),
    );
  }

  let filesUpdated = 0;
  let filesUnchanged = 0;
  let filesErrored = 0;

  for (const locale of locales) {
    for (const relativeFile of relativeFiles) {
      const baselinePath = path.join(baselineDir, relativeFile);
      const targetPath = path.join(localesRoot, locale, relativeFile);

      try {
        const [baselineJson, targetJson] = await Promise.all([
          readJson(baselinePath),
          readJson(targetPath),
        ]);

        const missing: string[] = [];
        collectMissingOrMismatched(baselineJson, targetJson, "", missing);

        if (missing.length === 0) {
          filesUnchanged++;
          continue;
        }

        const merged = mergeFromBaseline(baselineJson, targetJson);
        const body = `${JSON.stringify(merged, null, 2)}\n`;

        if (!dryRun) {
          await writeFile(targetPath, body, "utf8");
        }

        filesUpdated++;
        console.log(
          `${dryRun ? "DRY" : "✓"} ${locale}/${relativeFile} (+${missing.length} key(s))`,
        );
      } catch (error) {
        filesErrored++;
        console.error(`✗ ${locale}/${relativeFile}: ${(error as Error).message}`);
      }
    }
  }

  console.log("");
  console.log("Backfill summary");
  console.log(`  Baseline: ${baselineLocale}`);
  console.log(`  Locales: ${locales.join(", ")}`);
  console.log(`  Files scoped: ${relativeFiles.length}`);
  console.log(`  Updated: ${filesUpdated}`);
  console.log(`  Unchanged: ${filesUnchanged}`);
  console.log(`  Errors: ${filesErrored}`);

  if (filesErrored > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

