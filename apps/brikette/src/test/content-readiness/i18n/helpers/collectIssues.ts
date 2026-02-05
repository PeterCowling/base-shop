/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { i18nConfig, type AppLanguage } from "@/i18n.config";

import { PLACEHOLDER_PHRASES } from "../../../utils/detectRenderedI18nPlaceholders";

import { resolveGuideContentFileAllowlist } from "../../helpers/guideFilters";

const LOCALES_ROOT = path.resolve(__dirname, "../../../../locales");
const BASELINE_LOCALE: AppLanguage = "en";

const SKIP_FILE_PREFIXES: string[] = [
  // Guide long-form content has its own dedicated audits (schema, placeholders, EN fallbacks).
  // "guides/content/",
];

const RAW_KEY_PREFIXES = [
  "content.",
  "pages.",
  "components.",
  "common.",
  "footer.",
  "header.",
  "guides.",
  "assistance.",
  "translation.",
  "modals.",
  "seo.",
  "meta.",
];

const RAW_KEY_TOKEN_PATTERN = new RegExp(
  // Examples: pages.rooms.title, content.cheapEats.intro
  `\\b(?:${RAW_KEY_PREFIXES.map((p) => p.replace(".", "\\.")).join("|")})` +
    `[a-zA-Z0-9_-]+(?:\\.[a-zA-Z0-9_-]+)+\\b`,
  "g",
);

const PLACEHOLDER_PHRASE_PATTERNS = PLACEHOLDER_PHRASES.map((phrase) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}[.!?…]*`, "i");
});

const NON_LATIN_LOCALES = new Set<AppLanguage>(["ar", "hi", "ja", "ko", "ru", "zh"]);
const ENGLISH_STOPWORD_PATTERN =
  /\b(the|and|or|to|from|with|without|for|of|in|on|at|your|you|we|our|this|that|is|are|be|a|an)\b/u;

export type IssueKind =
  | "missingFile"
  | "extraFile"
  | "missingKey"
  | "extraKey"
  | "typeMismatch"
  | "emptyString"
  | "placeholderKey"
  | "placeholderPhrase"
  | "rawKeyToken"
  | "englishDuplicate"
  | "tooShort"
  | "scriptMismatch"
  | "arrayLengthMismatch";

export type Issue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: IssueKind;
  message: string;
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
    /\.(?:js|ts|tsx|jsx|json|css|scss|png|jpe?g|svg|webp|gif|md)(\?|#|$)/iu.test(
      trimmed,
    )
  );
}

function isMostlyPunctuation(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const lettersOrNumbers = (trimmed.match(/[\p{L}\p{N}]/gu) ?? []).length;
  return lettersOrNumbers === 0;
}

function detectPlaceholderPhrase(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return PLACEHOLDER_PHRASE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function hasRawKeyToken(value: string): string[] {
  const matches = value.match(RAW_KEY_TOKEN_PATTERN);
  return matches ? Array.from(new Set(matches)) : [];
}

function minLengthRatioForLocale(locale: string): number {
  // CJK can be much shorter than English; other scripts usually track closer.
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
  // Kebab-case slugs (canonical across locales).
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(trimmed);
}

function isLikelyNonTranslatableKeyPath(keyPath: string): boolean {
  // Keys that are expected to be stable identifiers (not translated).
  return /(^|\.)(slug|id|href|url|src)$/u.test(keyPath);
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
  // IDs / codes / very short fragments are often shared across locales.
  if (trimmed.length <= 3) return true;
  return false;
}

function truncate(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
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
  const isGuideContent = file.startsWith("guides/content/");

  if (typeof base === "string") {
    if (typeof target !== "string") {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "typeMismatch",
        message: `Expected string, got ${target === null ? "null" : typeof target}`,
      });
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
      });
      return;
    }

    // Key-as-value placeholder (most common runtime-missing symptom when values are stubbed)
    if (targetTrimmed === keyPath) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "placeholderKey",
        message: `Value equals key path (${JSON.stringify(keyPath)})`,
      });
    }

    if (!isGuideContent && detectPlaceholderPhrase(targetTrimmed)) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "placeholderPhrase",
        message: `Contains placeholder phrase (${JSON.stringify(truncate(targetTrimmed))})`,
      });
    }

    const rawTokens = hasRawKeyToken(targetTrimmed);
    if (rawTokens.length > 0) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "rawKeyToken",
        message: `Contains raw i18n key token(s): ${rawTokens.slice(0, 3).join(", ")}`,
      });
    }

    // Heuristics relative to English baseline
    if (
      baseTrimmed.length >= 25 &&
      baseTrimmed === targetTrimmed &&
      isLikelyEnglishSentence(baseTrimmed) &&
      !isLikelyNonTranslatableKeyPath(keyPath) &&
      !isLikelyNonTranslatableString(baseTrimmed)
    ) {
      if (!isGuideContent) {
        issues.push({
          locale,
          file,
          keyPath,
          kind: "englishDuplicate",
          message: `Value matches EN exactly (${JSON.stringify(truncate(targetTrimmed))})`,
        });
      }
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
        });
      }
    }

    // Script sanity: for non-Latin locales, long strings should include some non-ASCII text.
    if (
      NON_LATIN_LOCALES.has(locale as AppLanguage) &&
      baseTrimmed.length >= 40 &&
      isLikelyEnglishSentence(baseTrimmed)
    ) {
      if (!isLikelyNonTranslatableString(targetTrimmed)) {
        const nonAsciiCount = (targetTrimmed.match(/[^\x00-\x7f]/gu) ?? []).length;
        if (nonAsciiCount === 0) {
          issues.push({
            locale,
            file,
            keyPath,
            kind: "scriptMismatch",
            message: `Expected non-ASCII characters for locale "${locale}" (looks like Latin/EN text)`,
          });
        }
      }
    }

    return;
  }

  if (Array.isArray(base)) {
    if (!Array.isArray(target)) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "typeMismatch",
        message: `Expected array, got ${target === null ? "null" : typeof target}`,
      });
      return;
    }

    if (base.length !== target.length) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "arrayLengthMismatch",
        message: `Array length differs (en=${base.length}, ${locale}=${target.length})`,
      });
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
      issues.push({
        locale,
        file,
        keyPath,
        kind: "typeMismatch",
        message: `Expected object, got ${target === null ? "null" : typeof target}`,
      });
      return;
    }

    for (const [key, value] of Object.entries(base)) {
      if (!(key in target)) {
        const pathKey = keyPath ? `${keyPath}.${key}` : key;
        issues.push({
          locale,
          file,
          keyPath: pathKey,
          kind: "missingKey",
          message: "Missing key",
        });
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

    for (const extraKey of Object.keys(target)) {
      if (extraKey in base) continue;
      if (extraKey === "_schemaValidation") continue; // metadata opt-out, allowed
      const pathKey = keyPath ? `${keyPath}.${extraKey}` : extraKey;
      issues.push({
        locale,
        file,
        keyPath: pathKey,
        kind: "extraKey",
        message: "Extra key (not present in EN baseline)",
      });
    }

    return;
  }

  // Non-string primitives are unusual in i18n JSON, but if EN has them,
  // locales should match type to avoid runtime surprises.
  if (typeof base !== typeof target) {
    issues.push({
      locale,
      file,
      keyPath,
      kind: "typeMismatch",
      message: `Type differs (en=${typeof base}, ${locale}=${typeof target})`,
    });
  }
}

export function collectIssuesForFileFilter(fileFilter: (file: string) => boolean): Issue[] {
  const baselineDir = path.join(LOCALES_ROOT, BASELINE_LOCALE);
  const baselineFiles = listJsonFiles(baselineDir).filter(fileFilter);
  const baselineSet = new Set(baselineFiles);

  const locales = (i18nConfig.supportedLngs ?? []).filter(
    (locale) => locale !== BASELINE_LOCALE,
  ) as string[];

  const issues: Issue[] = [];

  for (const locale of locales) {
    const localeDir = path.join(LOCALES_ROOT, locale);
    if (!existsSync(localeDir) || !statSync(localeDir).isDirectory()) {
      issues.push({
        locale,
        file: "(locale)",
        keyPath: "",
        kind: "missingFile",
        message: "Locale directory is missing",
      });
      continue;
    }

    const localeFiles = listJsonFiles(localeDir).filter(fileFilter);
    const localeSet = new Set(localeFiles);

    // Missing / extra files
    for (const file of baselineFiles) {
      if (!localeSet.has(file)) {
        issues.push({
          locale,
          file,
          keyPath: "",
          kind: "missingFile",
          message: "Missing file (present in EN baseline)",
        });
      }
    }
    for (const file of localeFiles) {
      if (!baselineSet.has(file)) {
        issues.push({
          locale,
          file,
          keyPath: "",
          kind: "extraFile",
          message: "Extra file (not present in EN baseline)",
        });
      }
    }

    // Deep compare values for files that exist in both
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
