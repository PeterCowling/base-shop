/* eslint-disable security/detect-non-literal-fs-filename -- TEST-1001: Repo-local fixtures. [ttl=2026-12-31] */
import fs from "fs";
import path from "path";

type Match = {
  locale: string;
  file: string;
  path: string;
  value: string;
};

const localesDir = path.join(process.cwd(), "src/locales");
const placeholderRegex = /^content\.[^\s]+$/u;

const collectMatches = (node: unknown, currentPath: string, matches: Match[], filePath: string, locale: string): void => {
  if (typeof node === "string") {
    const trimmed = node.trim();
    if (placeholderRegex.test(trimmed)) {
      matches.push({
        locale,
        file: filePath,
        path: currentPath || "root",
        value: trimmed,
      });
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      collectMatches(item, `${currentPath}[${index}]`, matches, filePath, locale),
    );
    return;
  }

  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      collectMatches(value, nextPath, matches, filePath, locale);
    }
  }
};

const loadLocaleFiles = (localeDir: string): string[] => {
  const files: string[] = [];
  for (const entry of fs.readdirSync(localeDir)) {
    const entryPath = path.join(localeDir, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      files.push(...loadLocaleFiles(entryPath));
    } else if (stat.isFile() && entry.endsWith(".json")) {
      files.push(entryPath);
    }
  }
  return files;
};

const run = (): void => {
  const locales = fs
    .readdirSync(localesDir)
    .filter((locale) => {
      if (locale.startsWith("_")) return false;
      if (locale === "en") return false;
      const stats = fs.statSync(path.join(localesDir, locale));
      return stats.isDirectory();
    });

  const matches: Match[] = [];

  for (const locale of locales) {
    const localePath = path.join(localesDir, locale);
    const files = loadLocaleFiles(localePath);
    for (const filePath of files) {
      const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
      collectMatches(json, "", matches, path.relative(process.cwd(), filePath), locale);
    }
  }

  if (matches.length === 0) {
    return;
  }

  const sample = matches
    .slice(0, 20)
    .map((match) => `${match.locale} :: ${match.file} :: ${match.path} :: "${match.value}"`)
    .join("\n");

  throw new Error(
    [
      `Found ${matches.length} translation entries that still contain placeholder keys.`,
      "Translate these strings instead of leaving the `content.*` tokens as values.",
      "Sample:",
      sample,
    ].join("\n"),
  );
};

run();