import { readFile, stat } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import { logger } from "../utils";

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function isPathInside(child: string, parent: string): boolean {
  const parentPath = path.resolve(parent) + path.sep;
  const childPath = path.resolve(child) + path.sep;
  return childPath.startsWith(parentPath);
}

async function fileExists(p: string, baseDir?: string): Promise<boolean> {
  try {
    if (baseDir && !isPathInside(p, baseDir)) return false;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-0001 path validated via isPathInside()
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
    } else {
      const root = (exportsField as Record<string, unknown>)["."] ?? exportsField;

      if (typeof root === "string") {
        candidates.push(path.resolve(dir, root));
      } else if (root && typeof root === "object") {
        const entryObj = root as Record<string, string>;
        if (entryObj.import)
          candidates.push(path.resolve(dir, entryObj.import));
        if (entryObj.default)
          candidates.push(path.resolve(dir, entryObj.default));
        if (entryObj.require)
          candidates.push(path.resolve(dir, entryObj.require));
      }
    }
  } catch {
    // ignore malformed exports
  }
  return unique(candidates);
}

export async function resolvePluginEntry(dir: string): Promise<{
  entryPath: string | null;
  isModule: boolean;
}> {
  try {
    const pkgPath = path.join(dir, "package.json");
    // Validate target is the expected file within the provided directory
    if (path.basename(pkgPath) !== "package.json" || !isPathInside(pkgPath, dir)) {
      return { entryPath: null, isModule: false };
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-0001 path validated to be inside plugin dir
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
      if (await fileExists(candidate, dir)) {
        return {
          entryPath: candidate,
          isModule: isModule || /\.mjs$/.test(candidate),
        };
      }
    }
    return { entryPath: null, isModule };
  } catch (err) {
    // i18n-exempt: internal log message only, not user-facing UI copy
    logger.error("Failed to read plugin package.json", { plugin: dir, err });
    return { entryPath: null, isModule: false };
  }
}

export async function importByType(entryPath: string, isModule: boolean) {
  // Prefer require() for CommonJS entries to avoid Jest/Node ESM resolution issues.
  if (!isModule && /\.(cjs|js)$/.test(entryPath)) {
    // Support both ESM and CJS contexts without using import.meta in CJS.
     
    const getMetaUrl = () => {
      try {
        // Constructed at runtime so CJS parsers don't choke on import.meta
        // i18n-exempt: string used for runtime evaluation, not user copy
        return (Function("return import.meta.url")() as string) || undefined;
      } catch {
        return undefined;
      }
    };
    const base = getMetaUrl() ?? __filename;
    const req = createRequire(base);
     
    return req(entryPath);
  }
  // For ESM, use dynamic import with webpackIgnore to avoid bundler analysis.
  return import(/* webpackIgnore: true */ pathToFileURL(entryPath).href);
}
