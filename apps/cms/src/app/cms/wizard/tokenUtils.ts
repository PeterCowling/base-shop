// apps/cms/src/app/cms/wizard/tokenUtils.ts
import { type TokenMap as ThemeTokenMap, tokens as baseTokensSrc } from "@themes/base";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export type TokenMap = Record<keyof ThemeTokenMap, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light]),
) as TokenMap;

function toStringTokens(tokens: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tokens).map(([k, v]) => [
      k,
      typeof v === "string" ? v : (v as { light?: string }).light,
    ]),
  ) as Record<string, string>;
}

type ThemeTokensModule = { tokens?: Record<string, unknown> };

const THEME_TAILWIND_LOADERS: Record<string, () => Promise<ThemeTokensModule>> = {
  bcd: () => import("@themes/bcd/tailwind-tokens"),
  // @ts-expect-error -- @themes/brandx has no built dist/; package.json exports reference
  // dist/src/tailwind-tokens.d.ts which is gitignored. Resolved by webpack (transpilePackages) at runtime.
  brandx: () => import("@themes/brandx/tailwind-tokens"),
  // @ts-expect-error -- @themes/dark has no built dist/; same as brandx above.
  dark: () => import("@themes/dark/tailwind-tokens"),
  dummy: () => import("@themes/dummy/tailwind-tokens"),
  prime: () => import("@themes/prime/tailwind-tokens"),
};

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (!theme || theme === "base") return baseTokens;

  // Avoid template-string dynamic imports here. When webpack sees `@themes/${theme}`
  // it creates a broad module context and can pull in unintended theme-package files
  // (e.g. jest configs), which has historically caused build OOMs.
  const loader = THEME_TAILWIND_LOADERS[theme];
  if (!loader) return baseTokens;

  try {
    const mod = await loader();
    const overrides = mod.tokens ? toStringTokens(mod.tokens) : {};
    return { ...baseTokens, ...overrides } as TokenMap;
  } catch {
    return baseTokens;
  }
}
