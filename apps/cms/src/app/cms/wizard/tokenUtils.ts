// apps/cms/src/app/cms/wizard/tokenUtils.ts
import { type TokenMap as ThemeTokenMap, tokens as baseTokensSrc } from "@themes/base";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export type TokenMap = Record<keyof ThemeTokenMap, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

function toStringTokens(tokens: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([k, v]) => [k, typeof v === "string" ? v : (v as { light?: string }).light])
  ) as Record<string, string>;
}

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (!theme || theme === "base") return baseTokens;
  try {
    const mod = await import(
      /* webpackExclude: /\.(map|d\.ts|tsbuildinfo)$/ */
      `@themes/${theme}/tailwind-tokens`
    );
    const overrides = "tokens" in mod ? toStringTokens((mod as { tokens: Record<string, unknown> }).tokens) : {};
    return { ...baseTokens, ...overrides } as TokenMap;
  } catch {
    return baseTokens;
  }
}
