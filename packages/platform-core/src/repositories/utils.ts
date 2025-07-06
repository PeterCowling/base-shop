import "server-only";

import * as fsSync from "node:fs";
import * as path from "node:path";

export function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

export const DATA_ROOT = resolveDataRoot();

/**
 * Load Tailwind design tokens for the given theme.
 * Falls back to an empty object when the theme does not
 * provide a `tailwind-tokens` module.
 */
export async function loadThemeTokens(
  theme: string
): Promise<Record<string, string>> {
  if (theme === "base") return {};
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return (mod as { tokens: Record<string, string> }).tokens;
  } catch {
    return {};
  }
}
