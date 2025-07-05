// apps/cms/src/app/cms/wizard/utils.ts
/* eslint-disable import/consistent-type-specifier-style */

import {
  tokens as baseTokensSrc,
  type TokenMap as ThemeTokenMap,
} from "@themes/base/tokens";

/**
 * Record of “CSS custom-property → string value”.
 * (e.g. `"--color-bg" → "0 0% 100%"`)
 */
export type TokenMap = Record<keyof ThemeTokenMap, string>;

/* ----------------------------------------------------------
 *  Strong-typed Object.entries helper
 * ---------------------------------------------------------- */
function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/* ----------------------------------------------------------
 *  Base theme – flatten { light, dark? } → string
 * ---------------------------------------------------------- */
export const baseTokens: TokenMap = Object.fromEntries(
  typedEntries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

/* ----------------------------------------------------------
 *  Load tokens for an arbitrary theme at runtime
 * ---------------------------------------------------------- */
export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (theme === "base") return baseTokens;

  /* try regular theme tokens first ---------------------------------- */
  try {
    const mod = await import(`@themes/${theme}/tokens`);
    return Object.fromEntries(
      typedEntries(mod.tokens as ThemeTokenMap).map(([k, v]) => [k, v.light])
    ) as TokenMap;
  } catch {
    /* fallback: tailwind-generated token file ------------------------ */
    try {
      const mod = await import(`@themes/${theme}/tailwind-tokens`);
      return mod.tokens as TokenMap;
    } catch {
      return baseTokens;
    }
  }
}

/* ----------------------------------------------------------
 *  Wizard helper utilities
 * ---------------------------------------------------------- */
export const STORAGE_KEY = "cms-wizard-progress";

export function resetWizardProgress(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}
