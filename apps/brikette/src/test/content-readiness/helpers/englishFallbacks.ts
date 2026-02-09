/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Reads repo-local locale fixtures under src/locales. [ttl=2026-12-31] */
import fs from "node:fs";
import path from "node:path";

import { resolveGuideContentFileAllowlist } from "./guideFilters";
import { type JsonPath,walkJsonStrings } from "./jsonWalker";

type StringMap = Record<JsonPath, string>;

export type EnglishGuideDuplicate = {
  locale: string;
  file: string;
  path: JsonPath;
  value: string;
};

export type EnglishFallbackScanOptions = {
  localesDir: string;
  minLength?: number;
};

function normalize(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

const EN_STOPWORDS = new Set([
  "the",
  "and",
  "or",
  "to",
  "from",
  "with",
  "without",
  "for",
  "of",
  "in",
  "on",
  "at",
  "your",
  "you",
  "we",
  "our",
  "this",
  "that",
  "is",
  "are",
  "be",
  "a",
  "an",
] as const);

function isMostlyAsciiLetters(value: string): boolean {
  const asciiLetters = (value.match(/[A-Za-z]/gu) ?? []).length;
  const nonAscii = (value.match(/[^\x00-\x7f]/gu) ?? []).length;
  return asciiLetters >= 10 && asciiLetters >= nonAscii;
}

function isUrlLike(value: string): boolean {
  const normalized = value.trim();
  return (
    /^https?:\/\/\S+/iu.test(normalized) ||
    normalized.startsWith("www.") ||
    normalized.startsWith("/") ||
    /\.(png|jpe?g|webp|svg|gif)(\?|$)/iu.test(normalized)
  );
}

function tokenizeAsciiWords(value: string): string[] {
  return value.match(/\b[A-Za-z][A-Za-z'’.-]*\b/gu) ?? [];
}

function isLikelyProperNounLabel(value: string): boolean {
  const normalized = value.trim();
  if (normalized.length < 30) return false;

  const words = tokenizeAsciiWords(normalized);
  if (words.length < 4) return false;

  let stopwords = 0;
  let capitalLike = 0;
  let lowercase = 0;

  for (const word of words) {
    const lower = word.toLowerCase();
    if (EN_STOPWORDS.has(lower as (typeof EN_STOPWORDS extends Set<infer T> ? T : never))) {
      stopwords += 1;
    }

    if (/^[A-Z]/u.test(word) || /^[A-Z0-9]{2,}$/u.test(word)) {
      capitalLike += 1;
    }

    if (/^[a-z]/u.test(word)) {
      lowercase += 1;
    }
  }

  if (stopwords > 0) return false;

  const capitalRatio = capitalLike / words.length;
  const hasListSeparators = /[,/→•|]/u.test(normalized);

  // Exclude place-name lists / labels like:
  // "Positano, Praiano, Amalfi, Ravello" or "Amalfi → Positano / Capri"
  if (hasListSeparators && capitalRatio >= 0.75 && lowercase <= 1) {
    return true;
  }

  return false;
}

function loadGuideStrings(dir: string, minLength: number): Record<string, StringMap> {
  const result: Record<string, StringMap> = {};
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as unknown;
    const map: StringMap = {};
    walkJsonStrings(json, ({ path: jsonPath, value }) => {
      const normalized = normalize(value);
      if (isUrlLike(normalized)) return;
      if (isLikelyProperNounLabel(normalized)) return;
      if (normalized.length >= minLength && isMostlyAsciiLetters(normalized)) {
        map[jsonPath] = normalized;
      }
    });
    result[file] = map;
  }

  return result;
}

export function findEnglishGuideDuplicates({
  localesDir,
  minLength = 40,
}: EnglishFallbackScanOptions): EnglishGuideDuplicate[] {
  const allowlist = resolveGuideContentFileAllowlist();
  const enGuidesContentDir = path.join(localesDir, "en", "guides", "content");
  const enStringsByFile = loadGuideStrings(enGuidesContentDir, minLength);
  const locales = fs
    .readdirSync(localesDir)
    .filter(
      (locale) =>
        !locale.startsWith("_") &&
        locale !== "en" &&
        fs.statSync(path.join(localesDir, locale)).isDirectory(),
    );

  const duplicates: EnglishGuideDuplicate[] = [];

  for (const locale of locales) {
    const localeDir = path.join(localesDir, locale, "guides", "content");
    if (!fs.existsSync(localeDir)) continue;
    const localeStringsByFile = loadGuideStrings(localeDir, minLength);

    for (const [file, enMap] of Object.entries(enStringsByFile)) {
      if (allowlist && !allowlist.has(`guides/content/${file}`)) continue;
      const localeMap = localeStringsByFile[file];
      if (!localeMap) continue;
      for (const [jsonPath, enValue] of Object.entries(enMap)) {
        const localeValue = localeMap[jsonPath];
        if (localeValue && localeValue === enValue) {
          duplicates.push({
            locale,
            file,
            path: jsonPath,
            value: localeValue.slice(0, 120),
          });
        }
      }
    }
  }

  return duplicates;
}

export function formatEnglishGuideDuplicatesSample(duplicates: EnglishGuideDuplicate[], maxItems = 20): string {
  return duplicates
    .slice(0, maxItems)
    .map((d) => {
      const value = d.value.length > 120 ? `${d.value.slice(0, 117)}...` : d.value;
      return `${d.locale} :: ${d.file} :: ${d.path} :: ${JSON.stringify(value)}`;
    })
    .join("\n");
}
