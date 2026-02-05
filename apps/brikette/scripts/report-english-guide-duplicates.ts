#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- CLI reads locale JSON under src/locales. */

import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");

type Duplicate = {
  locale: string;
  file: string;
  path: string;
  value: string;
};

type ParseFailure = {
  locale: string;
  file: string;
  error: string;
};

type Report = {
  generatedAt: string;
  localesRoot: string;
  locales: string[];
  summary: {
    totalDuplicates: number;
    totalParseFailures: number;
    byLocale: Array<{ locale: string; duplicates: number; files: number }>;
    byFile: Array<{ file: string; duplicates: number; locales: number }>;
  };
  duplicates: Duplicate[];
  parseFailures: ParseFailure[];
};

type Args = {
  localesRoot: string;
  locales?: string[];
  minLength: number;
  output?: string;
  json: boolean;
};

const parseArgs = (): Args => {
  const rawArgs = process.argv.slice(2);

  const localesRootRaw = rawArgs
    .find((arg) => arg.startsWith("--locales-root="))
    ?.slice("--locales-root=".length);
  const localesRoot = localesRootRaw
    ? path.isAbsolute(localesRootRaw)
      ? localesRootRaw
      : path.resolve(APP_ROOT, localesRootRaw)
    : DEFAULT_LOCALES_ROOT;

  const localesRaw = rawArgs.find((arg) => arg.startsWith("--locales="))?.slice("--locales=".length);
  const locales = localesRaw
    ? localesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((value, index, all) => all.indexOf(value) === index)
    : undefined;

  const minLengthRaw = rawArgs
    .find((arg) => arg.startsWith("--min-length="))
    ?.slice("--min-length=".length);
  const minLength = minLengthRaw ? Number(minLengthRaw) : 40;
  if (!Number.isFinite(minLength) || minLength < 1) {
    throw new Error(`Invalid --min-length value: ${JSON.stringify(minLengthRaw)}`);
  }

  const output = rawArgs.find((arg) => arg.startsWith("--output="))?.slice("--output=".length);
  const json = rawArgs.includes("--json") || Boolean(output);

  return { localesRoot, locales, minLength, output, json };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalize = (value: string): string => value.replace(/\s+/gu, " ").trim();

const isMostlyAsciiLetters = (value: string): boolean => {
  const asciiLetters = (value.match(/[A-Za-z]/gu) ?? []).length;
  const nonAscii = (value.match(/[^\x00-\x7f]/gu) ?? []).length;
  return asciiLetters >= 10 && asciiLetters >= nonAscii;
};

const isUrlLike = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    /^https?:\/\/\S+/iu.test(trimmed) ||
    trimmed.startsWith("www.") ||
    trimmed.startsWith("/") ||
    /\.(png|jpe?g|webp|svg|gif)(\?|$)/iu.test(trimmed)
  );
};

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

const tokenizeAsciiWords = (value: string): string[] => value.match(/\b[A-Za-z][A-Za-z'’.-]*\b/gu) ?? [];

const isLikelyProperNounLabel = (value: string): boolean => {
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
  return hasListSeparators && capitalRatio >= 0.75 && lowercase <= 1;
};

const walkStrings = (
  value: unknown,
  visit: (args: { path: string; value: string }) => void,
  currentPath = "",
): void => {
  if (typeof value === "string") {
    visit({ path: currentPath, value });
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const next = currentPath ? `${currentPath}[${i}]` : `[${i}]`;
      walkStrings(value[i], visit, next);
    }
    return;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      const next = currentPath ? `${currentPath}.${key}` : key;
      walkStrings(child, visit, next);
    }
  }
};

const readJson = async (absolutePath: string): Promise<unknown> => {
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as unknown;
};

const loadGuideStringsByPath = async (absolutePath: string, minLength: number): Promise<Map<string, string>> => {
  const json = await readJson(absolutePath);
  const map = new Map<string, string>();
  walkStrings(json, ({ path: jsonPath, value }) => {
    const normalized = normalize(value);
    if (isUrlLike(normalized)) return;
    if (isLikelyProperNounLabel(normalized)) return;
    if (normalized.length < minLength) return;
    if (!isMostlyAsciiLetters(normalized)) return;
    map.set(jsonPath, normalized);
  });
  return map;
};

const listLocaleDirs = async (localesRoot: string): Promise<string[]> => {
  const entries = await readdir(localesRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_"))
    .sort();
};

const fileExists = async (absolutePath: string): Promise<boolean> => {
  try {
    return (await stat(absolutePath)).isFile();
  } catch {
    return false;
  }
};

const buildReport = (args: { localesRoot: string; locales?: string[]; minLength: number }): Report => {
  const duplicates: Duplicate[] = [];
  const parseFailures: ParseFailure[] = [];

  const byLocaleMap = new Map<string, { duplicates: number; files: Set<string> }>();
  const byFileMap = new Map<string, { duplicates: number; locales: Set<string> }>();

  const locales: string[] = [];

  const byLocale = Array.from(byLocaleMap.entries())
    .map(([locale, stats]) => ({ locale, duplicates: stats.duplicates, files: stats.files.size }))
    .sort((a, b) => b.duplicates - a.duplicates || a.locale.localeCompare(b.locale));

  const byFile = Array.from(byFileMap.entries())
    .map(([file, stats]) => ({ file, duplicates: stats.duplicates, locales: stats.locales.size }))
    .sort((a, b) => b.duplicates - a.duplicates || a.file.localeCompare(b.file));

  return {
    generatedAt: new Date().toISOString(),
    localesRoot: args.localesRoot,
    locales,
    summary: {
      totalDuplicates: duplicates.length,
      totalParseFailures: parseFailures.length,
      byLocale,
      byFile,
    },
    duplicates,
    parseFailures,
  };
};

const formatText = (report: Report, minLength: number): string => {
  const lines: string[] = [];
  lines.push("English guide duplicates (non-en)");
  lines.push(`Locales root: ${report.localesRoot}`);
  lines.push(`Min length: >= ${minLength}`);
  lines.push(`Total duplicates: ${report.summary.totalDuplicates}`);
  lines.push(`Parse failures: ${report.summary.totalParseFailures}`);
  lines.push("");

  lines.push("Top locales:");
  for (const item of report.summary.byLocale.slice(0, 12)) {
    lines.push(`  - ${item.locale}: ${item.duplicates} strings in ${item.files} files`);
  }
  lines.push("");

  lines.push("Top files:");
  for (const item of report.summary.byFile.slice(0, 12)) {
    lines.push(`  - ${item.file}: ${item.duplicates} strings across ${item.locales} locales`);
  }

  return lines.join("\n");
};

const main = async (): Promise<void> => {
  const args = parseArgs();
  const localesAll = await listLocaleDirs(args.localesRoot);
  const locales = (args.locales?.length ? args.locales : localesAll).filter((l) => l !== "en");

  const enGuidesDir = path.join(args.localesRoot, "en", "guides", "content");
  const enGuideFiles = (await readdir(enGuidesDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const duplicates: Duplicate[] = [];
  const parseFailures: ParseFailure[] = [];

  const enCache = new Map<string, Map<string, string>>();

  for (const file of enGuideFiles) {
    const enPath = path.join(enGuidesDir, file);
    try {
      const enStrings = await loadGuideStringsByPath(enPath, args.minLength);
      enCache.set(file, enStrings);
    } catch (error) {
      parseFailures.push({
        locale: "en",
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const locale of locales) {
    const localeGuidesDir = path.join(args.localesRoot, locale, "guides", "content");
    for (const file of enGuideFiles) {
      const enStrings = enCache.get(file);
      if (!enStrings) continue;

      const localePath = path.join(localeGuidesDir, file);
      if (!(await fileExists(localePath))) continue;

      let localeStrings: Map<string, string>;
      try {
        localeStrings = await loadGuideStringsByPath(localePath, args.minLength);
      } catch (error) {
        parseFailures.push({
          locale,
          file,
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      for (const [jsonPath, enValue] of enStrings.entries()) {
        const localeValue = localeStrings.get(jsonPath);
        if (!localeValue) continue;
        if (localeValue !== enValue) continue;
        duplicates.push({ locale, file, path: jsonPath, value: localeValue.slice(0, 120) });
      }
    }
  }

  const byLocaleMap = new Map<string, { duplicates: number; files: Set<string> }>();
  const byFileMap = new Map<string, { duplicates: number; locales: Set<string> }>();

  for (const dup of duplicates) {
    const localeStats = byLocaleMap.get(dup.locale) ?? { duplicates: 0, files: new Set<string>() };
    localeStats.duplicates += 1;
    localeStats.files.add(dup.file);
    byLocaleMap.set(dup.locale, localeStats);

    const fileStats = byFileMap.get(dup.file) ?? { duplicates: 0, locales: new Set<string>() };
    fileStats.duplicates += 1;
    fileStats.locales.add(dup.locale);
    byFileMap.set(dup.file, fileStats);
  }

  const report: Report = {
    generatedAt: new Date().toISOString(),
    localesRoot: args.localesRoot,
    locales,
    summary: {
      totalDuplicates: duplicates.length,
      totalParseFailures: parseFailures.length,
      byLocale: Array.from(byLocaleMap.entries())
        .map(([locale, stats]) => ({
          locale,
          duplicates: stats.duplicates,
          files: stats.files.size,
        }))
        .sort((a, b) => b.duplicates - a.duplicates || a.locale.localeCompare(b.locale)),
      byFile: Array.from(byFileMap.entries())
        .map(([file, stats]) => ({ file, duplicates: stats.duplicates, locales: stats.locales.size }))
        .sort((a, b) => b.duplicates - a.duplicates || a.file.localeCompare(b.file)),
    },
    duplicates,
    parseFailures,
  };

  if (!args.json) {
    console.log(formatText(report, args.minLength));
    return;
  }

  const body = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) {
    const outPath = path.isAbsolute(args.output) ? args.output : path.resolve(process.cwd(), args.output);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, body, "utf8");
    console.log(`Wrote JSON report: ${outPath}`);
    return;
  }

  console.log(body);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
