#!/usr/bin/env tsx
/* eslint-disable security/detect-non-literal-fs-filename -- CLI reads locale JSON under src/locales. */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { i18nConfig, type AppLanguage } from "../src/i18n.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_ROOT = path.resolve(__dirname, "..");
const DEFAULT_LOCALES_ROOT = path.join(APP_ROOT, "src", "locales");
const BASELINE_LOCALE: AppLanguage = "en";

type IssueKind =
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

type Issue = {
  locale: string;
  file: string;
  keyPath: string;
  kind: IssueKind;
  message: string;
};

type Args = {
  localesRoot: string;
  locales?: string[];
  includePrefixes: string[];
  excludePrefixes: string[];
  kinds?: IssueKind[];
  output?: string;
  json: boolean;
};

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
  `\\b(?:${RAW_KEY_PREFIXES.map((p) => p.replace(".", "\\.")).join("|")})` +
    `[a-zA-Z0-9_-]+(?:\\.[a-zA-Z0-9_-]+)+\\b`,
  "g",
);

const ENGLISH_STOPWORD_PATTERN =
  /\b(the|and|or|to|from|with|without|for|of|in|on|at|your|you|we|our|this|that|is|are|be|a|an)\b/u;

const NON_LATIN_LOCALES = new Set<AppLanguage>(["ar", "hi", "ja", "ko", "ru", "zh"]);

const PLACEHOLDER_PHRASES = [
  "TODO",
  "TBD",
  "Lorem ipsum",
  "PLACEHOLDER",
  "TRANSLATE_ME",
  "NOT_TRANSLATED",
];

const PLACEHOLDER_PHRASE_PATTERNS = PLACEHOLDER_PHRASES.map((phrase) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`${escaped}[.!?…]*`, "i");
});

function parseKinds(value: string): IssueKind[] {
  const allowed = new Set<IssueKind>([
    "missingFile",
    "extraFile",
    "missingKey",
    "extraKey",
    "typeMismatch",
    "emptyString",
    "placeholderKey",
    "placeholderPhrase",
    "rawKeyToken",
    "englishDuplicate",
    "tooShort",
    "scriptMismatch",
    "arrayLengthMismatch",
  ]);

  const kinds = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as IssueKind[];

  for (const kind of kinds) {
    if (!allowed.has(kind)) {
      throw new Error(`Unknown --kinds entry: ${JSON.stringify(kind)}`);
    }
  }

  return kinds;
}

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

  const includePrefixesRaw = rawArgs
    .find((arg) => arg.startsWith("--include-prefixes="))
    ?.slice("--include-prefixes=".length);
  const includePrefixes = includePrefixesRaw
    ? includePrefixesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const excludePrefixesRaw = rawArgs
    .find((arg) => arg.startsWith("--exclude-prefixes="))
    ?.slice("--exclude-prefixes=".length);
  const excludePrefixes = excludePrefixesRaw
    ? excludePrefixesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["guides/content/"];

  const kindsRaw = rawArgs.find((arg) => arg.startsWith("--kinds="))?.slice("--kinds=".length);
  const kinds = kindsRaw ? parseKinds(kindsRaw) : undefined;

  const output = rawArgs.find((arg) => arg.startsWith("--output="))?.slice("--output=".length);
  const json = rawArgs.includes("--json") || Boolean(output);

  return { localesRoot, locales, includePrefixes, excludePrefixes, kinds, output, json };
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

function isLikelyNonTranslatableKeyPath(keyPath: string): boolean {
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
  if (trimmed.length <= 3) return true;
  return false;
}

function truncate(value: string, max = 120): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3)}...`;
}

function shouldIncludeFile(file: string, args: Args): boolean {
  if (args.excludePrefixes.some((prefix) => file.startsWith(prefix))) return false;
  if (args.includePrefixes.length === 0) return true;
  return args.includePrefixes.some((prefix) => file.startsWith(prefix));
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

    if (targetTrimmed === keyPath) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "placeholderKey",
        message: `Value equals key path (${JSON.stringify(keyPath)})`,
      });
    }

    if (detectPlaceholderPhrase(targetTrimmed)) {
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

    if (
      baseTrimmed.length >= 25 &&
      baseTrimmed === targetTrimmed &&
      isLikelyEnglishSentence(baseTrimmed) &&
      !isLikelyNonTranslatableKeyPath(keyPath) &&
      !isLikelyNonTranslatableString(baseTrimmed)
    ) {
      issues.push({
        locale,
        file,
        keyPath,
        kind: "englishDuplicate",
        message: `Value matches EN exactly (${JSON.stringify(truncate(targetTrimmed))})`,
      });
    }

    if (
      !isLikelyNonTranslatableString(baseTrimmed) &&
      baseTrimmed.length >= 40 &&
      isLikelyEnglishSentence(baseTrimmed)
    ) {
      const minRatio = minLengthRatioForLocale(locale);
      const minAbs = minAbsoluteLengthForEnglishSource(baseTrimmed.length);
      const isTooShort =
        targetTrimmed.length < minAbs || targetTrimmed.length < baseTrimmed.length * minRatio;
      if (isTooShort) {
        issues.push({
          locale,
          file,
          keyPath,
          kind: "tooShort",
          message: `Suspiciously short vs EN (en=${baseTrimmed.length}, ${locale}=${targetTrimmed.length})`,
        });
      }
    }

    if (
      NON_LATIN_LOCALES.has(locale as AppLanguage) &&
      baseTrimmed.length >= 40 &&
      isLikelyEnglishSentence(baseTrimmed) &&
      !isLikelyNonTranslatableString(targetTrimmed)
    ) {
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
      if (extraKey === "_schemaValidation") continue;
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

function filterIssues(issues: Issue[], kinds?: IssueKind[]): Issue[] {
  if (!kinds?.length) return issues;
  const set = new Set(kinds);
  return issues.filter((issue) => set.has(issue.kind));
}

function collectIssues(args: Args): Issue[] {
  const baselineDir = path.join(args.localesRoot, BASELINE_LOCALE);
  const baselineFiles = listJsonFiles(baselineDir).filter((file) => shouldIncludeFile(file, args));
  const baselineSet = new Set(baselineFiles);

  const requestedLocales = args.locales?.length
    ? args.locales
    : ((i18nConfig.supportedLngs ?? []).filter((l) => l !== BASELINE_LOCALE) as string[]);

  const locales = requestedLocales.filter((locale, index, all) => all.indexOf(locale) === index);

  const issues: Issue[] = [];

  for (const locale of locales) {
    const localeDir = path.join(args.localesRoot, locale);
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

    const localeFiles = listJsonFiles(localeDir).filter((file) => shouldIncludeFile(file, args));
    const localeSet = new Set(localeFiles);

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

  return filterIssues(issues, args.kinds);
}

function buildSummary(issues: Issue[]): {
  totalIssues: number;
  byLocale: Array<{ locale: string; issues: number }>;
  byKind: Array<{ kind: IssueKind; issues: number }>;
} {
  const byLocale = new Map<string, number>();
  const byKind = new Map<IssueKind, number>();

  for (const issue of issues) {
    byLocale.set(issue.locale, (byLocale.get(issue.locale) ?? 0) + 1);
    byKind.set(issue.kind, (byKind.get(issue.kind) ?? 0) + 1);
  }

  return {
    totalIssues: issues.length,
    byLocale: Array.from(byLocale.entries())
      .map(([locale, count]) => ({ locale, issues: count }))
      .sort((a, b) => b.issues - a.issues || a.locale.localeCompare(b.locale)),
    byKind: Array.from(byKind.entries())
      .map(([kind, count]) => ({ kind, issues: count }))
      .sort((a, b) => b.issues - a.issues || a.kind.localeCompare(b.kind)),
  };
}

function formatText(args: Args, issues: Issue[]): string {
  const summary = buildSummary(issues);
  const lines: string[] = [];

  lines.push("i18n parity/quality issues vs EN baseline");
  lines.push(`Locales root: ${args.localesRoot}`);
  lines.push(`Excluded prefixes: ${args.excludePrefixes.join(", ") || "(none)"}`);
  lines.push(`Included prefixes: ${args.includePrefixes.join(", ") || "(all)"}`);
  if (args.kinds?.length) lines.push(`Kinds: ${args.kinds.join(", ")}`);
  if (args.locales?.length) lines.push(`Locales: ${args.locales.join(", ")}`);
  lines.push(`Total issues: ${summary.totalIssues}`);
  lines.push("");

  lines.push("Top locales:");
  for (const item of summary.byLocale.slice(0, 12)) {
    lines.push(`  - ${item.locale}: ${item.issues}`);
  }
  lines.push("");

  lines.push("Top kinds:");
  for (const item of summary.byKind.slice(0, 12)) {
    lines.push(`  - ${item.kind}: ${item.issues}`);
  }
  lines.push("");

  lines.push("Sample:");
  for (const issue of issues.slice(0, 40)) {
    lines.push(
      `${issue.locale} :: ${issue.file} :: ${issue.keyPath} :: ${issue.kind} :: ${issue.message}`,
    );
  }

  return lines.join("\n");
}

const main = async (): Promise<void> => {
  const args = parseArgs();
  const issues = collectIssues(args);

  if (!args.json) {
    console.log(formatText(args, issues));
    process.exitCode = issues.length > 0 ? 1 : 0;
    return;
  }

  const summary = buildSummary(issues);
  const report = {
    generatedAt: new Date().toISOString(),
    localesRoot: args.localesRoot,
    baselineLocale: BASELINE_LOCALE,
    locales: args.locales ?? (i18nConfig.supportedLngs ?? []).filter((l) => l !== BASELINE_LOCALE),
    includePrefixes: args.includePrefixes,
    excludePrefixes: args.excludePrefixes,
    kinds: args.kinds,
    summary,
    issues,
  };

  const body = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) {
    const outPath = path.isAbsolute(args.output) ? args.output : path.resolve(process.cwd(), args.output);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, body, "utf8");
    console.log(`Wrote JSON report: ${outPath}`);
    process.exitCode = issues.length > 0 ? 1 : 0;
    return;
  }

  console.log(body);
  process.exitCode = issues.length > 0 ? 1 : 0;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

