/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] CLI diagnostics output. */
/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] CLI audit reads locale JSON files from the app workspace. */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig } from "../src/i18n.config";

type StringMap = Record<string, string>;

type FileSpec = {
  file: string;
  skipExact?: Set<string>;
  skipPatterns?: RegExp[];
  includePatterns?: RegExp[];
};

const BASE_LOCALE = "en";
const MAX_SAMPLE_LENGTH = 140;
const MIN_LENGTH = 3;
const MIN_TOKEN_COUNT = 8;
const NEAR_ENGLISH_THRESHOLD = 0.9;

const ASSISTANCE_FILES: FileSpec[] = [
  {
    file: "assistanceSection.json",
    skipExact: new Set(["slug", "addressValue", "crosslinks.heading", "crosslinks.intro"]),
    skipPatterns: [/^bookingOptions\./u],
  },
  {
    file: "assistance.json",
    skipExact: new Set(["contactCta.href"]),
  },
];

const ARTICLE_FILES: FileSpec[] = [
  "ageAccessibility.json",
  "bookingBasics.json",
  "changingCancelling.json",
  "checkinCheckout.json",
  "defectsDamages.json",
  "depositsPayments.json",
  "rules.json",
  "security.json",
  "legal.json",
  "arrivingByFerry.json",
  "naplesAirportBus.json",
  "travelHelp.json",
].map((file) => ({
  file,
  skipExact: new Set(["slug"]),
}));

const KEYWORD_FIELDS_PATTERN = /^entries\[\d+\]\.(s\d+|humanReadableQuestion|humanReadableAnswer|linkText\d+)$/u;

const KEYWORDS_FILE: FileSpec = {
  file: "assistanceKeywords.json",
  includePatterns: [KEYWORD_FIELDS_PATTERN],
};

const FILES: FileSpec[] = [...ASSISTANCE_FILES, ...ARTICLE_FILES, KEYWORDS_FILE];

const ALLOWED_SAME_VALUES = new Set(["No."]);

const normalize = (value: string): string => value.replace(/\s+/gu, " ").trim();

const isUrlLike = (value: string): boolean => {
  const normalized = value.trim();
  const lower = normalized.toLowerCase();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("www.") ||
    normalized.startsWith("/") ||
    /\\.(png|jpe?g|webp|svg|gif)(\\?|$)/i.test(normalized)
  );
};

const collectStrings = (
  node: unknown,
  prefix: string,
  rawMap: StringMap,
  normalizedMap: StringMap,
): void => {
  if (typeof node === "string") {
    rawMap[prefix] = node;
    normalizedMap[prefix] = normalize(node);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => collectStrings(item, `${prefix}[${index}]`, rawMap, normalizedMap));
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      collectStrings(value, nextPrefix, rawMap, normalizedMap);
    }
  }
};

const loadMaps = (filePath: string): { raw: StringMap; normalized: StringMap } => {
  const raw = readFileSync(filePath, "utf8");
  const json = JSON.parse(raw) as unknown;
  const rawMap: StringMap = {};
  const normalizedMap: StringMap = {};
  collectStrings(json, "", rawMap, normalizedMap);
  return { raw: rawMap, normalized: normalizedMap };
};

const isSkippable = (key: string, skipExact: Set<string>, skipPatterns: RegExp[]): boolean =>
  skipExact.has(key) || skipPatterns.some((pattern) => pattern.test(key));

const shouldCheckKey = (key: string, includePatterns: RegExp[] | undefined): boolean =>
  !includePatterns || includePatterns.some((pattern) => pattern.test(key));

const shouldSkipValue = (value: string): boolean =>
  value.length < MIN_LENGTH || ALLOWED_SAME_VALUES.has(value) || isUrlLike(value);

const tokenize = (value: string): string[] => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/u).filter(Boolean);
};

const isNearEnglish = (enValue: string, localizedValue: string): boolean => {
  const enTokens = tokenize(enValue);
  const localTokens = tokenize(localizedValue);

  if (enTokens.length < MIN_TOKEN_COUNT || localTokens.length < MIN_TOKEN_COUNT) {
    return false;
  }

  const localSet = new Set(localTokens);
  const overlap = enTokens.reduce((count, token) => count + (localSet.has(token) ? 1 : 0), 0);
  return overlap / enTokens.length >= NEAR_ENGLISH_THRESHOLD;
};

type Failure = {
  locale: string;
  file: string;
  key: string;
  issue: "missing-file" | "missing-string" | "matches-english" | "near-english";
  sample?: string;
};

const formatSample = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > MAX_SAMPLE_LENGTH ? `${trimmed.slice(0, MAX_SAMPLE_LENGTH - 3)}...` : trimmed;
};

const main = (): void => {
  const supported = (i18nConfig.supportedLngs ?? []) as string[];
  const locales = supported.filter((locale) => locale !== BASE_LOCALE);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const localesRoot = path.resolve(__dirname, "..", "src", "locales");

  const failures: Failure[] = [];

  for (const { file, skipExact, skipPatterns, includePatterns } of FILES) {
    const basePath = path.join(localesRoot, BASE_LOCALE, file);
    if (!existsSync(basePath)) {
      throw new Error(`Missing baseline help content file: ${basePath}`);
    }
    const base = loadMaps(basePath);
    const effectiveSkipExact = new Set(skipExact);
    const effectiveSkipPatterns = skipPatterns ?? [];
    if (file === "assistance.json") {
      for (const key of Object.keys(base.normalized)) {
        if (key.startsWith("quickLinks[") && key.endsWith(".slug")) {
          effectiveSkipExact.add(key);
        }
      }
    }

    for (const locale of locales) {
      const localePath = path.join(localesRoot, locale, file);
      if (!existsSync(localePath)) {
        failures.push({ locale, file, key: "__file__", issue: "missing-file" });
        continue;
      }

      const local = loadMaps(localePath);

      for (const [key, enValue] of Object.entries(base.normalized)) {
        if (!shouldCheckKey(key, includePatterns)) continue;
        if (isSkippable(key, effectiveSkipExact, effectiveSkipPatterns)) continue;
        if (shouldSkipValue(enValue)) continue;
        const localizedValue = local.normalized[key];
        if (!localizedValue) {
          failures.push({
            locale,
            file,
            key,
            issue: "missing-string",
            sample: formatSample(base.raw[key]),
          });
          continue;
        }

        if (localizedValue === enValue) {
          failures.push({
            locale,
            file,
            key,
            issue: "matches-english",
            sample: formatSample(local.raw[key]),
          });
          continue;
        }

        if (isNearEnglish(enValue, localizedValue)) {
          failures.push({
            locale,
            file,
            key,
            issue: "near-english",
            sample: formatSample(local.raw[key]),
          });
        }
      }
    }
  }

  if (failures.length === 0) {
    console.log("Help section translation checks passed.");
    return;
  }

  console.error("Help section translation checks failed:");
  for (const failure of failures) {
    const sample = failure.sample ? ` :: ${JSON.stringify(failure.sample)}` : "";
    console.error(
      `- ${failure.locale} :: ${failure.file} :: ${failure.key} :: ${failure.issue}${sample}`,
    );
  }
  process.exitCode = 1;
};

main();
