import { readFile, stat } from "fs/promises";
import { createRequire } from "module";
import path from "path";
import { pathToFileURL } from "url";
import { logger } from "../utils";

// Use __filename if available (CommonJS), otherwise derive from import.meta.url
const req = createRequire(
  typeof __filename !== "undefined" ? __filename : eval("import.meta.url")
);

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

export function exportsToCandidates(
  dir: string,
  exportsField: unknown
): string[] {
  const candidates: string[] = [];
  if (!exportsField) return candidates;

  try {
    if (typeof exportsField === "string") {
      candidates.push(path.resolve(dir, exportsField));
      return candidates;
    }
    const root = (exportsField as Record<string, unknown>)["."] ?? exportsField;

    if (typeof root === "string") {
      candidates.push(path.resolve(dir, root));
      return candidates;
    }

    if (root && typeof root === "object") {
      const entryObj = root as Record<string, string>;
      if (entryObj.import) candidates.push(path.resolve(dir, entryObj.import));
      if (entryObj.default)
        candidates.push(path.resolve(dir, entryObj.default));
      if (entryObj.require)
        candidates.push(path.resolve(dir, entryObj.require));
    }
  } catch {
    // ignore malformed exports
  }
  return candidates;
}

export async function resolvePluginEntry(dir: string): Promise<{
  entryPath: string | null;
  isModule: boolean;
}> {
  try {
    const pkgPath = path.join(dir, "package.json");
    const rawPkg = await readFile(pkgPath, "utf8");
    const pkg = JSON.parse(rawPkg) as {
      type?: string;
      main?: string;
      module?: string;
      exports?: unknown;
    };
    const isModule = pkg.type === "module";

    // Candidates (compiled JS only)
    const candidates = unique(
      [
        ...(pkg.main ? [pkg.main] : []),
        ...(pkg.module ? [pkg.module] : []),
        ...exportsToCandidates(dir, pkg.exports),
        "dist/index.mjs",
        "dist/index.js",
        "dist/index.cjs",
        "index.mjs",
        "index.js",
        "index.cjs",
      ].map((p) => path.resolve(dir, p))
    );

    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        return {
          entryPath: candidate,
          isModule: isModule || /\.mjs$/.test(candidate),
        };
      }
    }
    return { entryPath: null, isModule };
  } catch (err) {
    logger.error("Failed to read plugin package.json", { plugin: dir, err });
    return { entryPath: null, isModule: false };
  }
}

export async function importByType(entryPath: string, isModule: boolean) {
  if (isModule || /\.mjs$/.test(entryPath)) {
    return import(pathToFileURL(entryPath).href);
  }
  return req(entryPath);
}

