#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- Script to analyze locale files */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const LOCALES_ROOT = path.resolve(__dirname, "../src/locales");
const BASELINE_LOCALE = "en";
const TARGET_LOCALES = ["vi", "hi", "ar", "ja", "ko", "it"];

const SKIP_FILE_PREFIXES = [
  "guides/content/",
];

const NON_LATIN_LOCALES = new Set(["ar", "hi", "ja", "ko", "ru", "zh"]);
const ENGLISH_STOPWORD_PATTERN =
  /\b(the|and|or|to|from|with|without|for|of|in|on|at|your|you|we|our|this|that|is|are|be|a|an)\b/u;

type Issue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: "emptyString" | "tooShort";
  message: string;
  enValue: string;
  localeValue: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function listJsonFiles(rootDir: string, relativeDir = ""): string[] {
  const out: string[] = [];
  const fullDir = path.join(rootDir, relativeDir);
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name;
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

function isUrlLike(value: string): boolean {
  const trimmed = value.trim();
  return (
    /^https?:\/\/\S+/iu.test(trimmed) ||
    trimmed.startsWith("www.") ||
    trimmed.startsWith("/") ||
    /^mailto:\S+/iu.test(trimmed)
  );
}

function isFilePathLike(value: string): boolean {
  const trimmed = value.trim();
  return (
    /^[./\\]/u.test(trimmed) ||
    /\.(?:js|ts|tsx|jsx|json|css|scss|png|jpe?g|svg|webp|gif|md)(\?|#|$)/iu.test(trimmed)
  );
}

function isMostlyPunctuation(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lettersOrNumbers = (trimmed.match(/[\p{L}\p{N}]/gu) ?? []).length;
  return lettersOrNumbers === 0;
}

function minLengthRatioForLocale(locale: string): number {
  if (locale === "ja" || locale === "ko" || locale === "zh") return 0.08;
  return 0.18;
}

function minAbsoluteLengthForEnglishSource(englishLength: number): number {
  if (englishLength >= 140) return 24;
  if (englishLength >= 80) return 14;
  if (englishLength >= 40) return 8;
  return 1;
}

function isSlugLike(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 4 || trimmed.length > 160) return false;
  if (trimmed.includes(" ")) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(trimmed);
}

function isLikelyEnglishSentence(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 25) return false;

  const lower = trimmed.toLowerCase();
  const words = lower.match(/\b[a-z]+\b/gu) ?? [];
  const wordCount = words.length;

  if (wordCount >= 10) return true;
  if (ENGLISH_STOPWORD_PATTERN.test(lower) && wordCount >= 4) return true;

  return false;
}

function isLikelyNonTranslatableString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (isUrlLike(trimmed)) return true;
  if (isFilePathLike(trimmed)) return true;
  if (isSlugLike(trimmed)) return true;
  if (trimmed.length <= 3) return true;
  return false;
}

function compareValues(args: {
  locale: string;
  file: string;
  keyPath: string;
  base: unknown;
  target: unknown;
  issues: Issue[];
}): void {
  const { locale, file, keyPath, base, target, issues } = args;

  if (typeof base === "string") {
    if (typeof target !== "string") {
      return;
    }

    const baseTrimmed = base.trim();
    const targetTrimmed = target.trim();

    if (targetTrimmed.length === 0) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "emptyString",
        message: "Value is empty/whitespace",
        enValue: baseTrimmed,
        localeValue: targetTrimmed,
      });
      return;
    }

    if (
      !isLikelyNonTranslatableString(baseTrimmed) &&
      baseTrimmed.length >= 40 &&
      isLikelyEnglishSentence(baseTrimmed)
    ) {
      const minRatio = minLengthRatioForLocale(locale);
      const minAbs = minAbsoluteLengthForEnglishSource(baseTrimmed.length);
      const isTooShort = targetTrimmed.length < minAbs || targetTrimmed.length < baseTrimmed.length * minRatio;
      if (isTooShort && !isMostlyPunctuation(targetTrimmed)) {
        issues.push({
          locale,
          file,
          keyPath,
          kind: "tooShort",
          message: `Suspiciously short vs EN (en=${baseTrimmed.length}, ${locale}=${targetTrimmed.length})`,
          enValue: baseTrimmed,
          localeValue: targetTrimmed,
        });
      }
    }

    return;
  }

  if (Array.isArray(base)) {
    if (!Array.isArray(target)) {
      return;
    }

    const minLen = Math.min(base.length, target.length);
    for (let i = 0; i < minLen; i++) {
      compareValues({
        locale,
        file,
        keyPath: keyPath ? `${keyPath}.${i}` : String(i),
        base: base[i],
        target: target[i],
        issues,
      });
    }
    return;
  }

  if (isRecord(base)) {
    if (!isRecord(target)) {
      return;
    }

    for (const [key, value] of Object.entries(base)) {
      if (!(key in target)) {
        continue;
      }

      const nextPath = keyPath ? `${keyPath}.${key}` : key;
      compareValues({
        locale,
        file,
        keyPath: nextPath,
        base: value,
        target: target[key],
        issues,
      });
    }
  }
}

function collectIssues(): Issue[] {
  const baselineDir = path.join(LOCALES_ROOT, BASELINE_LOCALE);
  const baselineFiles = listJsonFiles(baselineDir).filter((file) => !shouldSkipFile(file));

  const issues: Issue[] = [];

  for (const locale of TARGET_LOCALES) {
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

      compareValues({
        locale,
        file,
        keyPath: "",
        base: baseJson,
        target: localeJson,
        issues,
      });
    }
  }

  return issues;
}

const issues = collectIssues();
const outputPath = path.join(__dirname, "translation-issues.json");
writeFileSync(outputPath, JSON.stringify(issues, null, 2));

console.log(`Found ${issues.length} issues`);
console.log(`Output written to: ${outputPath}`);

const byLocale = issues.reduce<Record<string, Issue[]>>((acc, issue) => {
  acc[issue.locale] = acc[issue.locale] ?? [];
  acc[issue.locale].push(issue);
  return acc;
}, {});

for (const [locale, list] of Object.entries(byLocale)) {
  const emptyCount = list.filter(i => i.kind === "emptyString").length;
  const shortCount = list.filter(i => i.kind === "tooShort").length;
  console.log(`${locale}: ${list.length} total (empty=${emptyCount}, tooShort=${shortCount})`);
}
