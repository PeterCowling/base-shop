import { baseTokens, type TokenMap } from "./base";

export async function loadThemeTokensBrowser(theme?: string): Promise<TokenMap> {
  if (!theme || theme === "base") return baseTokens;
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
      `@themes/${theme}`,
    );
    if ("tokens" in mod) {
      return Object.fromEntries(
        Object.entries(
          (mod as { tokens: Record<string, string | { light: string }> }).tokens,
        ).map(([k, v]) => [k, typeof v === "string" ? v : v.light]),
      ) as TokenMap;
    }
  } catch {
    // Try package-local theme fixtures used in some tests
    try {
      const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$|__tests__\/)/ */
        `@themes-local/${theme}`,
      );
      if ("tokens" in mod) {
        return Object.fromEntries(
          Object.entries(
            (mod as { tokens: Record<string, string | { light: string }> }).tokens,
          ).map(([k, v]) => [k, typeof v === "string" ? v : v.light]),
        ) as TokenMap;
      }
    } catch {
      /* fall through to tailwind-tokens */
    }
  }
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`,
    );
    return (mod as { tokens: TokenMap }).tokens;
  } catch {
    try {
      const mod = await import(
        /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
        `@themes-local/${theme}/tailwind-tokens`,
      );
      return (mod as { tokens: TokenMap }).tokens;
    } catch {
      return baseTokens;
    }
  }
}

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  return loadThemeTokensBrowser(theme);
}

export { baseTokens };
export type { TokenMap };
