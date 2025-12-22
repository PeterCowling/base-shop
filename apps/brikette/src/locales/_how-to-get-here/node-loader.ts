// file path: src/locales/_how-to-get-here/node-loader.ts
// -----------------------------------------------------------------------------
// Node-only loader that assembles how-to-get-here route content from the split
// directory layout.
// -----------------------------------------------------------------------------

/*
 * ESLint security plugin flags any non-literal file path passed to `fs.*` APIs.
 * Every path in this module is routed through `createScopedPathResolver`, which
 * guarantees that operations stay within the expected locale directory and
 * throws if traversal is attempted. The disable below keeps the lint output
 * quiet while preserving the guard.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- INTL-482 scoped path resolver guards fs usage */

import fs from "fs";
import path from "path";

import type { HowToGetHereRoutesLocale } from "../../lib/how-to-get-here/schema";

function createScopedPathResolver(baseDir: string) {
  const resolvedBase = path.resolve(baseDir);

  return (...segments: string[]): string => {
    const candidate = path.resolve(resolvedBase, ...segments);
    if (candidate === resolvedBase) return candidate;

    const withSeparator = `${resolvedBase}${path.sep}`;
    if (!candidate.startsWith(withSeparator)) {
      throw new Error(`Refusing to access path outside of ${resolvedBase}`);
    }

    return candidate;
  };
}

function resolveLocalesRoot(cwd: string): string {
  const fallback = path.resolve(cwd, "src/locales");
  const candidates = [
    fallback,
    path.resolve(cwd, "apps/brikette/src/locales"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  return fallback;
}

function readJson(filePath: string): unknown {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function readSplitLocale(baseDir: string): HowToGetHereRoutesLocale | undefined {
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const splitDir = resolveScopedPath("how-to-get-here", "routes");
  if (!isDirectory(splitDir)) return undefined;

  const entries = fs
    .readdirSync(splitDir)
    .filter((entry) => entry.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const result: HowToGetHereRoutesLocale = {};
  for (const entry of entries) {
    const contentKey = entry.replace(/\.json$/u, "");
    const filePath = resolveScopedPath("how-to-get-here", "routes", entry);
    result[contentKey] = readJson(filePath) as HowToGetHereRoutesLocale[string];
  }

  return result;
}

export function loadHowToGetHereLocaleFromFs(
  locale: string,
  cwd = process.cwd(),
): HowToGetHereRoutesLocale | undefined {
  const localesRoot = resolveLocalesRoot(cwd);
  const resolveLocalePath = createScopedPathResolver(localesRoot);
  const baseDir = resolveLocalePath(locale);

  return readSplitLocale(baseDir);
}

/* eslint-enable security/detect-non-literal-fs-filename */
