import "server-only";

/**
 * Load Tailwind design tokens for the given theme.
 * Falls back to an empty object when the theme does not
 * provide a `tailwind-tokens` module.
 */
export async function loadThemeTokens(
  theme: string
): Promise<Record<string, string>> {
  if (theme === "base") return {};
  try {
    const mod = await import(
      /* webpackExclude: /(\.map$|\.d\.ts$|\.tsbuildinfo$)/ */
      `@themes/${theme}/tailwind-tokens`
    );
    return (mod as { tokens: Record<string, string> }).tokens;
  } catch {
    return {};
  }
}
