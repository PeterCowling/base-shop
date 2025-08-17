import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { createRequire } from "module";
import ts from "typescript";

import {
  tokens as baseTokensSrc,
  type TokenMap as ThemeTokenMap,
} from "@themes/base";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export type TokenMap = Record<keyof ThemeTokenMap, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

function transpileTokens(filePath: string, requireFn: NodeRequire): TokenMap {
  const source = readFileSync(filePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const sandbox: {
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
    require: NodeRequire;
  } = {
    module: { exports: {} },
    exports: {},
    require: requireFn,
  };
  sandbox.exports = sandbox.module.exports;
  runInNewContext(transpiled, sandbox);
  return sandbox.module.exports.tokens as TokenMap;
}

export function loadThemeTokensNode(theme: string): TokenMap {
  if (!theme || theme === "base") return {};
  // obtain a `require` function in both CJS and ESM environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const requireFn: NodeRequire =
    typeof require !== "undefined" ? require : createRequire(import.meta.url);
  try {
    // attempt to load compiled module
    const mod = requireFn(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    ) as { tokens: TokenMap };
    return mod.tokens;
  } catch {
    const modPath = join("packages", "themes", theme, "tailwind-tokens.ts");
    const srcPath = join("packages", "themes", theme, "src", "tailwind-tokens.ts");
    if (existsSync(modPath)) return transpileTokens(modPath, requireFn);
    if (existsSync(srcPath)) return transpileTokens(srcPath, requireFn);
    return {};
  }
}

export async function loadThemeTokensBrowser(theme: string): Promise<TokenMap> {
  if (!theme || theme === "base") return baseTokens;
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}`
    );
    if ("tokens" in mod) {
      return Object.fromEntries(
        typedEntries((mod as { tokens: ThemeTokenMap }).tokens).map(([k, v]) => [k, v.light])
      ) as TokenMap;
    }
  } catch {
    /* fall through to tailwind-tokens */
  }
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return (mod as { tokens: TokenMap }).tokens;
  } catch {
    return baseTokens;
  }
}

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (typeof window === "undefined") {
    return loadThemeTokensNode(theme);
  }
  return loadThemeTokensBrowser(theme);
}

