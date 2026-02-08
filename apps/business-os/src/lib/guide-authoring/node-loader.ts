/**
 * Node-only loader for guide content from brikette's locale files.
 *
 * Adapted from apps/brikette/src/locales/_guides/node-loader.ts
 * with configurable base path for cross-app usage.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- GS-001: scoped path resolver guards fs usage */
import fs from "fs";
import path from "path";

import { getLocalesDir } from "./config";

export type GuidesNamespace = {
  content: Record<string, unknown>;
  [key: string]: unknown;
};

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

function readJson(filePath: string): unknown {
  const data = fs.readFileSync(filePath, "utf8");
  return JSON.parse(data);
}

function isDirectory(filePath: string): boolean {
  try { return fs.statSync(filePath).isDirectory(); } catch { return false; }
}

function isFile(filePath: string): boolean {
  try { return fs.statSync(filePath).isFile(); } catch { return false; }
}

function writeJson(filePath: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, `${json}\n`, "utf8");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readGlobalEntries(
  resolveScopedPath: (...segments: string[]) => string,
  segments: string[] = [],
): Record<string, unknown> {
  const dirPath = resolveScopedPath("guides", ...segments);
  if (!isDirectory(dirPath)) return {};
  const result: Record<string, unknown> = {};
  for (const entry of fs.readdirSync(dirPath)) {
    if (entry === "content") continue;
    const nextSegments = [...segments, entry];
    const entryPath = resolveScopedPath("guides", ...nextSegments);
    if (isDirectory(entryPath)) {
      result[entry] = readGlobalEntries(resolveScopedPath, nextSegments);
      continue;
    }
    if (!entry.endsWith(".json") || !isFile(entryPath)) continue;
    result[entry.replace(/\.json$/u, "")] = readJson(entryPath);
  }
  return result;
}

function readSplitNamespace(baseDir: string): GuidesNamespace | undefined {
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const globalsDir = resolveScopedPath("guides");
  if (!isDirectory(globalsDir)) return undefined;
  const result: GuidesNamespace = { content: {} };
  Object.assign(result, readGlobalEntries(resolveScopedPath));
  const contentDir = resolveScopedPath("guides", "content");
  if (isDirectory(contentDir)) {
    const slugs = fs.readdirSync(contentDir).filter((f) => f.endsWith(".json"));
    slugs.sort((a, b) => a.localeCompare(b));
    for (const file of slugs) {
      const slug = file.replace(/\.json$/u, "");
      result.content[slug] = readJson(resolveScopedPath("guides", "content", file));
    }
  }
  return result;
}

function readLegacyNamespace(baseDir: string): GuidesNamespace | undefined {
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const file = resolveScopedPath("guides.json");
  if (!isFile(file)) return undefined;
  return readJson(file) as GuidesNamespace;
}

export function loadGuidesNamespaceFromFs(locale: string): GuidesNamespace | undefined {
  const localesRoot = getLocalesDir();
  const resolveLocalePath = createScopedPathResolver(localesRoot);
  const baseDir = resolveLocalePath(locale);
  return readSplitNamespace(baseDir) ?? readLegacyNamespace(baseDir);
}

export function writeGuidesNamespaceToFs(locale: string, data: GuidesNamespace): void {
  const localesRoot = getLocalesDir();
  const resolveLocalePath = createScopedPathResolver(localesRoot);
  const baseDir = resolveLocalePath(locale);
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const splitDir = resolveScopedPath("guides");

  if (isDirectory(splitDir)) {
    fs.mkdirSync(splitDir, { recursive: true });
    const content = (data.content as Record<string, unknown>) ?? {};
    const contentDir = resolveScopedPath("guides", "content");
    fs.mkdirSync(contentDir, { recursive: true });

    // Write global entries
    for (const [key, value] of Object.entries(data)) {
      if (key === "content") continue;
      if (key === "meta" && isPlainObject(value)) {
        const dirPath = resolveScopedPath("guides", key);
        fs.mkdirSync(dirPath, { recursive: true });
        for (const [childKey, childValue] of Object.entries(value)) {
          writeJson(resolveScopedPath("guides", key, `${childKey}.json`), childValue ?? {});
        }
        continue;
      }
      writeJson(resolveScopedPath("guides", `${key}.json`), value ?? {});
    }

    // Write content files
    for (const [slug, value] of Object.entries(content)) {
      writeJson(resolveScopedPath("guides", "content", `${slug}.json`), value ?? {});
    }
    return;
  }

  // Fallback: legacy single-file format
  writeJson(resolveScopedPath("guides.json"), data);
}
/* eslint-enable security/detect-non-literal-fs-filename -- GS-001 */
