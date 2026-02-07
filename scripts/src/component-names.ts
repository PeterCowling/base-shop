import { existsSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";

/**
 * Builds a mapping of component source files to their exported name
 * by walking through barrel files in the components directory.
 */
export function getComponentNameMap(componentsDir: string): Record<string, string> {
  const map = new Map<string, string>();

  function resolveFile(dir: string, rel: string): string | undefined {
    // First see if the import already includes an extension.
    const direct = path.join(dir, rel);
    if (existsSync(direct)) return direct;

    // Common file extensions we want to handle.
    const exts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
    for (const ext of exts) {
      const full = path.join(dir, rel + ext);
      if (existsSync(full)) return full;
    }

    // If the import points to a directory, look for index files.
    const indexExts = [
      "/index.ts",
      "/index.tsx",
      "/index.js",
      "/index.jsx",
      "/index.mjs",
      "/index.cjs",
    ];
    for (const ext of indexExts) {
      const full = path.join(dir, rel + ext);
      if (existsSync(full)) return full;
    }
    return undefined;
  }

  function walk(dir: string) {
    // Choose the first existing index file from a set of supported extensions.
    const indexCandidates = [
      "index.ts",
      "index.tsx",
      "index.js",
      "index.jsx",
      "index.mjs",
      "index.cjs",
    ];
    const indexFile = indexCandidates
      .map((f) => path.join(dir, f))
      .find((f) => existsSync(f));
    if (!indexFile) return;
    const src = readFileSync(indexFile, "utf8");

    // Handle re-exporting entire directories
    const starRe = /export\s+\*\s+from\s+["']\.\/(.+?)["'];?/g;
    let starMatch: RegExpExecArray | null;
    while ((starMatch = starRe.exec(src))) {
      walk(path.join(dir, starMatch[1]));
    }

    // Handle named/default exports
    const namedRe = /export\s+\{([^}]+)\}\s+from\s+["']\.\/(.+?)["'];?/g;
    let namedMatch: RegExpExecArray | null;
    while ((namedMatch = namedRe.exec(src))) {
      const rel = namedMatch[2];
      const specifiers = namedMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
      const file = resolveFile(dir, rel);
      if (!file) continue;
      if (statSync(file).isDirectory()) {
        walk(file);
        continue;
      }
      for (const spec of specifiers) {
        if (spec.startsWith("type ")) continue;
        let name = spec;
        if (spec.startsWith("default as ")) {
          name = spec.slice("default as ".length).trim();
        } else if (spec === "default") {
          name = path.parse(file).name;
        } else if (spec.includes(" as ")) {
          name = spec.split(/\s+as\s+/)[1];
        }
        const key = path.relative(componentsDir, file).replace(/\\/g, "/");
        if (!map.has(key)) {
          map.set(key, name);
        }
      }
    }
  }

  walk(componentsDir);
  return Object.fromEntries(map.entries());
}
