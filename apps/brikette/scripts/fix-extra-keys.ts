#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename */
import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { i18nConfig, type AppLanguage } from "../src/i18n.config";

const LOCALES_ROOT = path.resolve(__dirname, "../src/locales");
const BASELINE_LOCALE: AppLanguage = "en";

const SKIP_FILE_PREFIXES: string[] = [
  "guides/content/",
];

type ExtraKeyIssue = {
  locale: string;
  file: string;
  keyPath: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function listJsonFiles(rootDir: string, relativeDir = ""): string[] {
  const out: string[] = [];
  const fullDir = path.join(rootDir, relativeDir);
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
    const fullPath = path.join(rootDir, nextRelative);
    if (entry.isDirectory()) {
      out.push(...listJsonFiles(rootDir, nextRelative));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) {
      out.push(nextRelative);
    }
  }
  return out.sort();
}

function shouldSkipFile(relativeFile: string): boolean {
  return SKIP_FILE_PREFIXES.some((prefix) => relativeFile.startsWith(prefix));
}

function deleteKeyPath(obj: Record<string, unknown>, keyPath: string): boolean {
  const parts = keyPath.split(".");
  if (parts.length === 0) return false;

  if (parts.length === 1) {
    const key = parts[0];
    if (key in obj) {
      delete obj[key];
      return true;
    }
    return false;
  }

  const [firstKey, ...rest] = parts;
  if (!(firstKey in obj)) return false;

  const value = obj[firstKey];
  if (!isRecord(value)) return false;

  return deleteKeyPath(value, rest.join("."));
}

function findExtraKeys(args: {
  base: unknown;
  target: unknown;
  keyPath: string;
  extraKeys: string[];
}): void {
  const { base, target, keyPath, extraKeys } = args;

  if (!isRecord(base) || !isRecord(target)) {
    return;
  }

  for (const extraKey of Object.keys(target)) {
    if (extraKey in base) continue;
    if (extraKey === "_schemaValidation") continue; // metadata opt-out, allowed

    const pathKey = keyPath ? `${keyPath}.${extraKey}` : extraKey;
    extraKeys.push(pathKey);
  }

  for (const [key, value] of Object.entries(base)) {
    if (!(key in target)) continue;

    const nextPath = keyPath ? `${keyPath}.${key}` : key;
    findExtraKeys({
      base: value,
      target: target[key],
      keyPath: nextPath,
      extraKeys,
    });
  }
}

function collectExtraKeyIssues(): ExtraKeyIssue[] {
  const baselineDir = path.join(LOCALES_ROOT, BASELINE_LOCALE);
  const baselineFiles = listJsonFiles(baselineDir).filter((file) => !shouldSkipFile(file));

  const locales = (i18nConfig.supportedLngs ?? []).filter(
    (locale) => locale !== BASELINE_LOCALE,
  ) as string[];

  const issues: ExtraKeyIssue[] = [];

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    if (!existsSync(localeDir) || !statSync(localeDir).isDirectory()) {
      continue;
    }

    const localeFiles = listJsonFiles(localeDir).filter((file) => !shouldSkipFile(file));
    const localeSet = new Set(localeFiles);

    for (const file of baselineFiles) {
      if (!localeSet.has(file)) continue;

      const baseJson = JSON.parse(readFileSync(path.join(baselineDir, file), "utf8")) as unknown;
      const localeJson = JSON.parse(readFileSync(path.join(localeDir, file), "utf8")) as unknown;

      const extraKeys: string[] = [];
      findExtraKeys({
        base: baseJson,
        target: localeJson,
        keyPath: "",
        extraKeys,
      });

      for (const keyPath of extraKeys) {
        issues.push({ locale, file, keyPath });
      }
    }
  }

  return issues;
}

function main() {
  console.log("Finding extra keys in non-guide content files...\n");

  const issues = collectExtraKeyIssues();

  if (issues.length === 0) {
    console.log("No extra keys found!");
    return;
  }

  console.log(`Found ${issues.length} extra keys across ${new Set(issues.map(i => i.locale)).size} locales\n`);

  const byLocale = new Map<string, ExtraKeyIssue[]>();
  for (const issue of issues) {
    const list = byLocale.get(issue.locale) ?? [];
    list.push(issue);
    byLocale.set(issue.locale, list);
  }

  const stats: Record<string, number> = {};

  for (const [locale, localeIssues] of Array.from(byLocale.entries()).sort()) {
    console.log(`\n${locale}: ${localeIssues.length} extra keys`);

    const byFile = new Map<string, ExtraKeyIssue[]>();
    for (const issue of localeIssues) {
      const list = byFile.get(issue.file) ?? [];
      list.push(issue);
      byFile.set(issue.file, list);
    }

    let removedCount = 0;

    for (const [file, fileIssues] of byFile.entries()) {
      const filePath = path.join(LOCALES_ROOT, locale, file);

      if (!existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${file}`);
        continue;
      }

      const content = JSON.parse(readFileSync(filePath, "utf8")) as Record<string, unknown>;
      const originalKeys = JSON.stringify(Object.keys(content).sort());

      for (const issue of fileIssues) {
        const deleted = deleteKeyPath(content, issue.keyPath);
        if (deleted) {
          removedCount++;
          console.log(`  ✓ Removed: ${file} :: ${issue.keyPath}`);
        } else {
          console.log(`  ✗ Not found: ${file} :: ${issue.keyPath}`);
        }
      }

      const newKeys = JSON.stringify(Object.keys(content).sort());
      if (originalKeys !== newKeys) {
        writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
      }
    }

    stats[locale] = removedCount;
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log("=".repeat(60));
  for (const [locale, count] of Object.entries(stats).sort()) {
    console.log(`${locale}: ${count} keys removed`);
  }
  console.log(`\nTotal: ${Object.values(stats).reduce((a, b) => a + b, 0)} keys removed`);
}

main();
