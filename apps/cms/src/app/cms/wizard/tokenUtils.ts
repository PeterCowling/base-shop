// apps/cms/src/app/cms/wizard/tokenUtils.ts
/* eslint-disable import/consistent-type-specifier-style */

import {
  // ⬇️  root export – works for every theme that re‑exports `tokens` in its index.ts
  tokens as baseTokensSrc,
  type TokenMap as ThemeTokenMap,
} from "@themes/base";

/**
 * Record of “CSS custom‑property → string value”.
 * e.g. `"--color-bg" → "0 0% 100%"`
 */
export type TokenMap = Record<keyof ThemeTokenMap, string>;

/* ----------------------------------------------------------
 *  Strong‑typed Object.entries helper
 * ---------------------------------------------------------- */
function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/* ----------------------------------------------------------
 *  Base theme – flatten { light, dark? } → string
 * ---------------------------------------------------------- */
export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

/* ----------------------------------------------------------
 *  Load tokens for an arbitrary theme at runtime
 * ---------------------------------------------------------- */
export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  /* 1️⃣  base ---------------------------------------------------------------- */
  if (!theme || theme === "base") return baseTokens;

  /* 2️⃣  regular theme package export --------------------------------------- */
  try {
    // import from the *package root*, which publicly re‑exports `tokens`
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}`
    );
    if ("tokens" in mod) {
      return Object.fromEntries(
        typedEntries(mod.tokens as ThemeTokenMap).map(([k, v]) => [k, v.light])
      ) as TokenMap;
    }
  } catch {
    /* intentionally fall through to the Tailwind fallback */
  }

  /* 3️⃣  Tailwind‑generated token file fallback ----------------------------- */
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return mod.tokens as TokenMap;
  } catch {
    /* if everything fails, stay functional by falling back to base */
    return baseTokens;
  }
}
