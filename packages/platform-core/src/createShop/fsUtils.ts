/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * Filesystem helpers used during shop creation.
 *
 * The utilities here are intentionally small wrappers around Node's `fs`
 * functions so they can be mocked and tested in isolation.
 */
import {
  cpSync,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { loadTokens } from "./themeUtils";

// `__dirname` only exists in CommonJS builds; declare it so TypeScript allows
// referencing it as a fallback when running tests transpiled to CJS.
// eslint-disable-next-line no-var
declare var __dirname: string;

export function repoRoot(): string {
  const hasMarker = (dir: string): boolean =>
    existsSync(join(dir, "packages")) ||
    existsSync(join(dir, "apps")) ||
    existsSync(join(dir, "pnpm-workspace.yaml"));

  const searchUp = (start: string): string | null => {
    let dir = start;
    while (true) {
      if (hasMarker(dir)) return dir;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  };

  try {
    const moduleDir =
      typeof __dirname !== "undefined"
        ? __dirname
        : dirname(fileURLToPath(eval("import.meta.url")));
    const fromModule = searchUp(moduleDir);
    if (fromModule) return fromModule;
  } catch {
    /* ignore */
  }

  const fromCwd = searchUp(process.cwd());
  if (fromCwd) return fromCwd;

  // If the current working directory is above the repo root, scan its
  // immediate subdirectories for a workspace marker.
  try {
    for (const entry of readdirSync(process.cwd(), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const candidate = join(process.cwd(), entry.name);
      if (hasMarker(candidate)) return candidate;
    }
  } catch {
    /* ignore */
  }

  return process.cwd();
}

/**
 * Check if a file or directory exists.
 */
export function fileExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Ensure a directory exists, creating it recursively when missing.
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Copy a template application into a new shop directory.
 *
 * `node_modules` folders are skipped during the copy.
 */
export function copyTemplate(source: string, destination: string): void {
  cpSync(source, destination, {
    recursive: true,
    filter: (src) => !/node_modules/.test(src),
  });
}

/** Ensure selected theme and template are available. */
export function ensureTemplateExists(theme: string, template: string): string {
  if (!existsSync(join("packages", "themes", theme))) {
    throw new Error(`Theme '${theme}' not found in packages/themes`);
  }
  const templateApp = join("packages", template);
  if (!existsSync(templateApp)) {
    throw new Error(`Template '${template}' not found in packages`);
  }
  return templateApp;
}

/**
 * Read a UTF-8 text file.
 */
export function readFile(path: string): string {
  return readFileSync(path, "utf8");
}

/**
 * Write a UTF-8 text file.
 */
export function writeFile(path: string, content: string): void {
  writeFileSync(path, content);
}

/**
 * Write an object to disk as formatted JSON with trailing newline.
 */
export function writeJSON(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

export function listThemes(): string[] {
  const roots = new Set<string>([repoRoot(), process.cwd()]);
  try {
    const modRoot =
      typeof __dirname !== "undefined"
        ? join(__dirname, "../../../..")
        : join(dirname(fileURLToPath(eval("import.meta.url"))), "../../../..");
    roots.add(modRoot);
  } catch {
    /* ignore */
  }
  for (const root of roots) {
    try {
      const themesDir = join(root, "packages", "themes");
      const entries = readdirSync(themesDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
    } catch {
      /* try next root */
    }
  }
  // Return an empty array when the themes directory cannot be read
  return [];
}

/**
 * Update an existing shop to use a different theme.
 *
 * This adjusts the shop app's package dependency and global CSS token import.
 * It returns the default token map for the selected theme so callers can merge
 * in any overrides before persisting to the shop.json file.
 */
export function syncTheme(shop: string, theme: string): Record<string, string> {
  const root = repoRoot();
  const pkgRel = join("apps", shop, "package.json");
  const pkgAbs = join(root, pkgRel);
  const cssRel = join("apps", shop, "src", "app", "globals.css");
  const cssAbs = join(root, cssRel);

  try {
    const pkgPath = existsSync(pkgAbs)
      ? pkgAbs
      : existsSync(pkgRel)
      ? pkgRel
      : null;
    if (pkgPath) {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        dependencies?: Record<string, string>;
      };
      pkg.dependencies ??= {};
      for (const dep of Object.keys(pkg.dependencies)) {
        if (dep.startsWith("@themes/")) delete pkg.dependencies[dep];
      }
      pkg.dependencies[`@themes/${theme}`] = "workspace:*";
      const pkgJson = JSON.stringify(pkg, null, 2);
      for (const p of new Set([pkgRel, pkgAbs])) {
        try {
          writeFileSync(p, pkgJson);
        } catch {
          /* ignore write errors */
        }
      }
    }
  } catch {
    // ignore errors when package.json is missing or invalid
  }

  try {
    const cssPath = existsSync(cssAbs)
      ? cssAbs
      : existsSync(cssRel)
      ? cssRel
      : null;
    if (cssPath) {
      const css = readFileSync(cssPath, "utf8").replace(
        /@themes\/[^/]+\/tokens.css/,
        `@themes/${theme}/tokens.css`
      );
      for (const p of new Set([cssRel, cssAbs])) {
        try {
          writeFileSync(p, css);
        } catch {
          /* ignore write errors */
        }
      }
    }
  } catch {
    // ignore errors when globals.css cannot be read
  }

  return loadTokens(theme);
}
