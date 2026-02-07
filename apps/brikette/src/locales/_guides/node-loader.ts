// file path: src/locales/_guides/node-loader.ts
// -----------------------------------------------------------------------------
// Node-only loader that assembles the guides namespace from either the
// legacy `guides.json` file or the split directory structure.
// -----------------------------------------------------------------------------

/*
 * ESLint security plugin flags any non-literal file path passed to `fs.*` APIs.
 * Every path in this module is routed through `createScopedPathResolver`, which
 * guarantees that operations stay within the expected locale directory and
 * throws if traversal is attempted. The disable below keeps the lint output
 * quiet while preserving the guard.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- INTL-451 scoped path resolver guards fs usage */

import fs from "fs";
import path from "path";

import type { GuidesNamespace } from "../guides";

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

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
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

    if (!entry.endsWith(".json")) continue;
    if (!isFile(entryPath)) continue;

    const key = entry.replace(/\.json$/u, "");
    result[key] = readJson(entryPath);
  }

  return result;
}

function readSplitNamespace(baseDir: string): GuidesNamespace | undefined {
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const globalsDir = resolveScopedPath("guides");
  if (!isDirectory(globalsDir)) return undefined;

  const result: GuidesNamespace = {
    content: {},
  };

  Object.assign(result, readGlobalEntries(resolveScopedPath));

  const contentDir = resolveScopedPath("guides", "content");
  if (isDirectory(contentDir)) {
    const slugs = fs.readdirSync(contentDir).filter((file) => file.endsWith(".json"));
    slugs.sort((a, b) => a.localeCompare(b));
    for (const file of slugs) {
      const slug = file.replace(/\.json$/u, "");
      const filePath = resolveScopedPath("guides", "content", file);
      result.content[slug] = readJson(filePath);
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

export function loadGuidesNamespaceFromFs(locale: string, cwd = process.cwd()): GuidesNamespace | undefined {
  const localesRoot = resolveLocalesRoot(cwd);
  const resolveLocalePath = createScopedPathResolver(localesRoot);
  const baseDir = resolveLocalePath(locale);
  return readSplitNamespace(baseDir) ?? readLegacyNamespace(baseDir);
}

function writeGlobalFiles(
  resolveScopedPath: (...segments: string[]) => string,
  data: GuidesNamespace,
): { seenFiles: Set<string>; seenDirs: Map<string, Set<string>> } {
  const seenFiles = new Set<string>();
  const seenDirs = new Map<string, Set<string>>();

  for (const [key, value] of Object.entries(data)) {
    if (key === "content") continue;

    if (key === "meta" && isPlainObject(value)) {
      const dirPath = resolveScopedPath("guides", key);
      fs.mkdirSync(dirPath, { recursive: true });
      const childKeys = new Set<string>();

      for (const [childKey, childValue] of Object.entries(value)) {
        const childPath = resolveScopedPath("guides", key, `${childKey}.json`);
        writeJson(childPath, childValue ?? {});
        childKeys.add(childKey);
      }

      seenDirs.set(key, childKeys);
      continue;
    }

    const filePath = resolveScopedPath("guides", `${key}.json`);
    writeJson(filePath, value ?? {});
    seenFiles.add(key);
  }

  return { seenFiles, seenDirs };
}

function cleanStrayGlobalFiles(
  resolveScopedPath: (...segments: string[]) => string,
  splitDir: string,
  seenFiles: Set<string>,
  seenDirs: Map<string, Set<string>>,
): void {
  for (const entry of fs.readdirSync(splitDir)) {
    if (entry === "content") continue;

    const entryPath = resolveScopedPath("guides", entry);

    if (entry.endsWith(".json")) {
      const key = entry.replace(/\.json$/u, "");
      if (!seenFiles.has(key)) {
        fs.rmSync(entryPath);
      }
      continue;
    }

    if (isDirectory(entryPath)) {
      const allowedChildren = seenDirs.get(entry);
      if (!allowedChildren) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        continue;
      }

      for (const child of fs.readdirSync(entryPath)) {
        const childPath = resolveScopedPath("guides", entry, child);
        if (!child.endsWith(".json")) continue;
        const childKey = child.replace(/\.json$/u, "");
        if (!allowedChildren.has(childKey)) {
          fs.rmSync(childPath);
        }
      }
    }
  }
}

function writeContentFiles(
  resolveScopedPath: (...segments: string[]) => string,
  content: Record<string, unknown>,
  contentDir: string,
): void {
  const seenSlugs = new Set<string>();

  for (const [slug, value] of Object.entries(content)) {
    const filePath = resolveScopedPath("guides", "content", `${slug}.json`);
    writeJson(filePath, value ?? {});
    seenSlugs.add(slug);
  }

  if (isDirectory(contentDir)) {
    for (const entry of fs.readdirSync(contentDir)) {
      if (!entry.endsWith(".json")) continue;
      const slug = entry.replace(/\.json$/u, "");
      if (!seenSlugs.has(slug)) {
        fs.rmSync(resolveScopedPath("guides", "content", entry));
      }
    }
  }
}

export function writeGuidesNamespaceToFs(
  locale: string,
  data: GuidesNamespace,
  cwd = process.cwd(),
): void {
  const localesRoot = resolveLocalesRoot(cwd);
  const resolveLocalePath = createScopedPathResolver(localesRoot);
  const baseDir = resolveLocalePath(locale);
  const resolveScopedPath = createScopedPathResolver(baseDir);
  const splitDir = resolveScopedPath("guides");

  if (isDirectory(splitDir)) {
    fs.mkdirSync(splitDir, { recursive: true });

    const content = (data.content as Record<string, unknown>) ?? {};
    const contentDir = resolveScopedPath("guides", "content");
    fs.mkdirSync(contentDir, { recursive: true });

    const { seenFiles, seenDirs } = writeGlobalFiles(resolveScopedPath, data);
    cleanStrayGlobalFiles(resolveScopedPath, splitDir, seenFiles, seenDirs);
    writeContentFiles(resolveScopedPath, content, contentDir);

    return;
  }

  const legacyPath = resolveScopedPath("guides.json");
  writeJson(legacyPath, data);
}

/* eslint-enable security/detect-non-literal-fs-filename */
