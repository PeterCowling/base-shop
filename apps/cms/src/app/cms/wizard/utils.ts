import { tokens as baseTokensSrc } from "@themes/base/tokens";

export type TokenMap = Record<`--${string}`, string>;

export const baseTokens: TokenMap = Object.fromEntries(
  Object.entries(baseTokensSrc).map(([k, v]) => [k, v.light])
) as TokenMap;

export async function loadThemeTokens(theme: string): Promise<TokenMap> {
  if (theme === "base") return baseTokens;
  try {
    const mod = await import(`@themes/${theme}/tokens`);
    return Object.fromEntries(
      Object.entries(mod.tokens as Record<string, { light: string }>).map(
        ([k, v]) => [k, v.light]
      )
    ) as TokenMap;
  } catch {
    try {
      const mod = await import(`@themes/${theme}/tailwind-tokens`);
      return mod.tokens as TokenMap;
    } catch {
      return baseTokens;
    }
  }
}

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
