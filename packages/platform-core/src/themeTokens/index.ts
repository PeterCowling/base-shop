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
  // Resolve the workspace root relative to this file so consumers can call
  // the loader from any package without relying on their current working
  // directory.
  const rootDir = join(__dirname, "../../../../..");
  const baseDir = join(rootDir, "packages", "themes", theme);
  const candidates = [
    join(baseDir, "tailwind-tokens.js"),
    join(baseDir, "tailwind-tokens.ts"),
    join(baseDir, "src", "tailwind-tokens.ts"),
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      return transpileTokens(file);
    }
  }
  return {};
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

