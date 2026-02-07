// apps/cms/src/app/cms/wizard/tokenUtils.ts
import { type TokenMap as ThemeTokenMap,tokens as baseTokensSrc } from "@themes/base";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export type TokenMap = Record<keyof ThemeTokenMap, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
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
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return (mod as { tokens: TokenMap }).tokens;
  } catch {
    return baseTokens;
  }
}

