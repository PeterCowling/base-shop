import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export interface TypographyTokenGroup {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
}

export interface TextThemeDefinition {
  id: string;
  label: string;
  tokens: {
    base: TypographyTokenGroup;
    desktop?: TypographyTokenGroup;
    tablet?: TypographyTokenGroup;
    mobile?: TypographyTokenGroup;
  };
}

type Breakpoint = "desktop" | "tablet" | "mobile";

const BREAKPOINTS: Breakpoint[] = ["desktop", "tablet", "mobile"];

const PROPERTY_PREFIXES: ReadonlyArray<{
  key: keyof TypographyTokenGroup;
  prefix: string;
}> = [
  { key: "fontSize", prefix: "--font-size-" },
  { key: "lineHeight", prefix: "--line-height-" },
  { key: "fontWeight", prefix: "--font-weight-" },
  { key: "fontFamily", prefix: "--font-family-" },
];

const hasStringValues = (
  group?: Record<string, string | undefined>,
): group is Record<string, string> =>
  !!group && Object.values(group).some((value) => typeof value === "string" && value.trim().length > 0);

const hasTypographyEntries = (
  group?: TypographyTokenGroup,
): group is TypographyTokenGroup => hasStringValues(group);

const capitalizeTokenPart = (part: string) => {
  if (!part) return part;
  if (part.length <= 3) return part.toUpperCase();
  return part.charAt(0).toUpperCase() + part.slice(1);
};

const formatThemeLabel = (id: string) =>
  id
    .split("-")
    .filter(Boolean)
    .map(capitalizeTokenPart)
    .join(" ");

const parseTokenKey = (
  key: string,
): { id: string; breakpoint: Breakpoint | "base" } | null => {
  for (const { prefix } of PROPERTY_PREFIXES) {
    if (key.startsWith(prefix)) {
      const remainder = key.slice(prefix.length);
      if (!remainder) return null;
      for (const bp of BREAKPOINTS) {
        const suffix = `-${bp}`;
        if (remainder.endsWith(suffix)) {
          const id = remainder.slice(0, -suffix.length);
          if (!id) return null;
          return { id, breakpoint: bp };
        }
      }
      return { id: remainder, breakpoint: "base" };
    }
  }
  return null;
};

const getOrCreateGroup = (
  map: Map<string, TextThemeDefinition["tokens"]>,
  id: string,
) => {
  let entry = map.get(id);
  if (!entry) {
    entry = { base: {} };
    map.set(id, entry);
  }
  return entry;
};

export const extractTextThemes = (
  tokens: Record<string, string> | null | undefined,
): TextThemeDefinition[] => {
  if (!tokens) return [];
  const groups = new Map<string, TextThemeDefinition["tokens"]>();

  for (const key of Object.keys(tokens)) {
    for (const { key: property, prefix } of PROPERTY_PREFIXES) {
      if (!key.startsWith(prefix)) continue;
      const parsed = parseTokenKey(key);
      if (!parsed) continue;
      const entry = getOrCreateGroup(groups, parsed.id);
      if (parsed.breakpoint === "base") {
        entry.base[property] = key;
      } else {
        const target = (entry[parsed.breakpoint] ??= {});
        target[property] = key;
      }
    }
  }

  const themes: TextThemeDefinition[] = [];
  groups.forEach((value, id) => {
    if (
      !hasTypographyEntries(value.base) &&
      !hasTypographyEntries(value.desktop) &&
      !hasTypographyEntries(value.tablet) &&
      !hasTypographyEntries(value.mobile)
    ) {
      return;
    }
    themes.push({ id, label: formatThemeLabel(id), tokens: value });
  });

  return themes.sort((a, b) => a.label.localeCompare(b.label));
};

export const createTextThemeOverrides = (
  theme: TextThemeDefinition,
): Pick<
  StyleOverrides,
  "typography" | "typographyDesktop" | "typographyTablet" | "typographyMobile"
> => {
  const result: Pick<
    StyleOverrides,
    "typography" | "typographyDesktop" | "typographyTablet" | "typographyMobile"
  > = {};

  if (hasTypographyEntries(theme.tokens.base)) {
    result.typography = { ...theme.tokens.base };
  }
  if (hasTypographyEntries(theme.tokens.desktop)) {
    result.typographyDesktop = { ...theme.tokens.desktop };
  }
  if (hasTypographyEntries(theme.tokens.tablet)) {
    result.typographyTablet = { ...theme.tokens.tablet };
  }
  if (hasTypographyEntries(theme.tokens.mobile)) {
    result.typographyMobile = { ...theme.tokens.mobile };
  }

  return result;
};

const clonePreservingNonTypography = (
  overrides: StyleOverrides | undefined,
): StyleOverrides => {
  const next: StyleOverrides = {};
  if (hasStringValues(overrides?.color)) {
    next.color = { ...overrides.color };
  }
  if (overrides?.effects) {
    next.effects = { ...overrides.effects };
  }
  return next;
};

export const applyTextThemeToOverrides = (
  base: StyleOverrides | undefined,
  theme: TextThemeDefinition | null,
): StyleOverrides => {
  const next = clonePreservingNonTypography(base);
  if (!theme) {
    return next;
  }
  const overrides = createTextThemeOverrides(theme);
  return { ...next, ...overrides };
};

const matchesGroup = (
  overrides: TypographyTokenGroup | undefined,
  tokens: TypographyTokenGroup | undefined,
) => {
  if (!hasTypographyEntries(tokens)) return true;
  if (!overrides) return false;
  return (Object.entries(tokens) as [keyof TypographyTokenGroup, string][]).every(
    ([key, value]) => {
      const current = overrides[key];
      return !value || current === value;
    },
  );
};

export const matchTextTheme = (
  overrides: StyleOverrides | undefined,
  themes: TextThemeDefinition[],
): string | undefined => {
  if (!overrides) return undefined;
  for (const theme of themes) {
    if (
      matchesGroup(overrides.typography, theme.tokens.base) &&
      matchesGroup(overrides.typographyDesktop, theme.tokens.desktop) &&
      matchesGroup(overrides.typographyTablet, theme.tokens.tablet) &&
      matchesGroup(overrides.typographyMobile, theme.tokens.mobile)
    ) {
      return theme.id;
    }
  }
  return undefined;
};
