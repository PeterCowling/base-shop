export const THEME_MODE_KEY = "theme-mode";
export const THEME_NAME_KEY = "theme-name";
export const LEGACY_THEME_KEY = "theme";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeName = string;

export type LegacyTheme = "base" | "dark" | "brandx" | "system";

export function normalizeThemeMode(raw: string | null): ThemeMode | null {
  if (!raw) return null;
  if (raw === "base") return "light";
  if (raw === "light" || raw === "dark" || raw === "system") return raw;
  return null;
}

const THEME_NAME_PATTERN = /^[a-z0-9-]+$/;

export function normalizeThemeName(raw: string | null): ThemeName | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (!THEME_NAME_PATTERN.test(value)) return null;
  return value;
}

export function normalizeLegacyTheme(
  raw: string | null
): { mode?: ThemeMode; name?: ThemeName } | null {
  if (!raw) return null;
  if (raw === "dark" || raw === "system" || raw === "light" || raw === "base") {
    return { mode: normalizeThemeMode(raw) ?? "light", name: "base" };
  }
  if (raw === "brandx") {
    return { mode: "light", name: "brandx" };
  }
  return null;
}

export function legacyThemeFrom(mode: ThemeMode, name: ThemeName): LegacyTheme {
  if (name === "brandx") return "brandx";
  if (mode === "dark") return "dark";
  if (mode === "system") return "system";
  return "base";
}

export function splitLegacyTheme(theme: LegacyTheme): {
  mode: ThemeMode;
  name: ThemeName;
} {
  if (theme === "dark") return { mode: "dark", name: "base" };
  if (theme === "system") return { mode: "system", name: "base" };
  if (theme === "brandx") return { mode: "light", name: "brandx" };
  return { mode: "light", name: "base" };
}
