import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import ts from "typescript";

import {
  tokens as baseTokensSrc,
  type TokenMap as ThemeTokenMap,
} from "../../../themes/base/src";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export type TokenMap = Record<keyof ThemeTokenMap, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

function transpileTokens(filePath: string): TokenMap {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 path is constructed from controlled workspace locations
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: {
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
  } = {
    module: { exports: {} },
    exports: {},
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  return sandbox.module.exports.tokens as TokenMap;
}

export function loadThemeTokensNode(theme: string): TokenMap {
  if (!theme || theme === "base") return {};
  const tryRoot = (rootDir: string): TokenMap | undefined => {
    const baseDir = join(rootDir, "packages", "themes", theme);
    const candidates = [
      join(baseDir, "tailwind-tokens.js"),
      join(baseDir, "tailwind-tokens.ts"),
      join(baseDir, "src", "tailwind-tokens.ts"),
    ];
    for (const file of candidates) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on controlled workspace path
      if (existsSync(file)) {
        return transpileTokens(file);
      }
    }
    return undefined;
  };

  // First, look relative to this file's location. This allows callers to load
  // tokens without relying on their current working directory.
  const localRoot = join(__dirname, "../../../..");
  const localTokens = tryRoot(localRoot);
  if (localTokens) return localTokens;

  // Fall back to resolving the workspace root from the process cwd. Jest can
  // virtualize `__dirname`, so this ensures resolution still works.
  let cwd = process.cwd();
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CORE-1010 existence check on controlled workspace path
  while (!existsSync(join(cwd, "pnpm-workspace.yaml"))) {
    const parent = join(cwd, "..");
    if (parent === cwd) return {};
    cwd = parent;
  }
  const workspaceTokens = tryRoot(cwd);
  return workspaceTokens ?? {};
}

export async function loadThemeTokensBrowser(theme: string): Promise<TokenMap> {
  if (!theme || theme === "base") return baseTokens;
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
      `@themes/${theme}`
    );
    if ("tokens" in mod) {
      return Object.fromEntries(
        Object.entries(
          (mod as { tokens: Record<string, string | { light: string }> }).tokens
        ).map(([k, v]) => [k, typeof v === "string" ? v : v.light])
      ) as TokenMap;
    }
  } catch {
    // Try package-local theme fixtures used in some tests
    try {
      const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
        `@themes-local/${theme}`
      );
      if ("tokens" in mod) {
        return Object.fromEntries(
          Object.entries(
            (mod as { tokens: Record<string, string | { light: string }> }).tokens
          ).map(([k, v]) => [k, typeof v === "string" ? v : v.light])
        ) as TokenMap;
      }
    } catch {
      /* fall through to tailwind-tokens */
    }
  }
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return (mod as { tokens: TokenMap }).tokens;
  } catch {
    try {
      const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes-local/${theme}/tailwind-tokens`
      );
      return (mod as { tokens: TokenMap }).tokens;
    } catch {
      return baseTokens;
    }
  }
}

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (typeof window === "undefined") {
    return loadThemeTokensNode(theme);
  }
  return loadThemeTokensBrowser(theme);
}
