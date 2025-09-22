import type { StyleOverrides } from "@acme/types/style/StyleOverrides";

export type TextThemeGroupKey =
  | "typography"
  | "typographyDesktop"
  | "typographyTablet"
  | "typographyMobile";

type TypographyProp = "fontFamily" | "fontSize" | "fontWeight" | "lineHeight";
type BreakpointProp = "fontSize" | "lineHeight";

type TextThemeTokens = {
  typography?: Partial<Record<TypographyProp, string>>;
  typographyDesktop?: Partial<Record<BreakpointProp, string>>;
  typographyTablet?: Partial<Record<BreakpointProp, string>>;
  typographyMobile?: Partial<Record<BreakpointProp, string>>;
};

export interface TextTheme {
  id: string;
  label: string;
  tokens: TextThemeTokens;
}

const PROP_KEYS: Record<string, TypographyProp | BreakpointProp> = {
  fontfamily: "fontFamily",
  fontface: "fontFamily",
  fontfamilydefault: "fontFamily",
  font: "fontFamily",
  fontsize: "fontSize",
  textsize: "fontSize",
  typeface: "fontFamily",
  fontweight: "fontWeight",
  weight: "fontWeight",
  lineheight: "lineHeight",
  leading: "lineHeight",
  line: "lineHeight",
};

const VIEWPORT_KEYS: Record<string, keyof TextThemeTokens> = {
  desktop: "typographyDesktop",
  tablet: "typographyTablet",
  mobile: "typographyMobile",
};

const PREFIXES = new Set(["text", "typography", "type", "font", "styles"]);

function normalizeSegment(segment: string): string {
  return segment.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const normalized = part.toLowerCase();
      if (normalized.length <= 3 && /^[a-z]+$/.test(normalized)) {
        return normalized.toUpperCase();
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");
}

function pruneTypography(overrides: StyleOverrides): StyleOverrides {
  const next: StyleOverrides = { ...overrides };
  (['typography', 'typographyDesktop', 'typographyTablet', 'typographyMobile'] as const).forEach((key) => {
    const value = next[key];
    if (!value) return;
    const clone = { ...value } as Record<string, string | undefined>;
    Object.keys(clone).forEach((prop) => {
      if (clone[prop] === undefined) delete clone[prop];
    });
    if (Object.keys(clone).length === 0) {
      delete next[key];
    } else {
      next[key] = clone as typeof value;
    }
  });
  return next;
}

export function extractTextThemes(tokens: Record<string, string>): TextTheme[] {
  const themes = new Map<string, TextTheme>();

  Object.keys(tokens).forEach((originalKey) => {
    if (!originalKey.startsWith("--")) return;
    const trimmed = originalKey.slice(2);
    const segments = trimmed
      .split(/[-_]/)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => segment.toLowerCase());
    if (segments.length < 2) return;

    let viewport: keyof TextThemeTokens | undefined;
    const lastSegment = segments[segments.length - 1];
    if (VIEWPORT_KEYS[lastSegment]) {
      viewport = VIEWPORT_KEYS[lastSegment];
      segments.pop();
    }

    if (segments.length < 2) return;

    const maybePropSegments = segments.slice(-2);
    const combinedProp = normalizeSegment(maybePropSegments.join(""));
    let propKey = PROP_KEYS[combinedProp];
    if (!propKey) {
      const single = normalizeSegment(segments[segments.length - 1]);
      propKey = PROP_KEYS[single];
      if (propKey) {
        segments.pop();
      }
    } else {
      segments.pop();
      segments.pop();
    }

    if (!propKey) return;

    while (segments.length > 0 && PREFIXES.has(segments[0])) {
      segments.shift();
    }
    if (segments.length === 0) return;

    const styleName = segments.join("-");
    if (!styleName) return;

    const id = styleName;
    const label = toTitleCase(styleName);

    const existing = themes.get(id) ?? { id, label, tokens: {} };
    const targetGroup = viewport ?? "typography";

    const writableGroup =
      propKey === "fontFamily" && targetGroup !== "typography"
        ? "typography"
        : targetGroup;

    const target = existing.tokens[writableGroup] ?? {};
    (target as Record<string, string>)[propKey] = `--${trimmed}`;
    existing.tokens[writableGroup] = target as never;
    themes.set(id, existing);
  });

  return Array.from(themes.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function applyTextThemeToOverrides(
  overrides: StyleOverrides | undefined,
  theme: TextTheme,
): StyleOverrides {
  const base = overrides ? { ...overrides } : {};
  const next: StyleOverrides = {
    ...base,
    typography: { ...(base.typography ?? {}) },
    typographyDesktop: { ...(base.typographyDesktop ?? {}) },
    typographyTablet: { ...(base.typographyTablet ?? {}) },
    typographyMobile: { ...(base.typographyMobile ?? {}) },
    color: base.color ? { ...base.color } : base.color,
    effects: base.effects ? { ...base.effects } : base.effects,
  };

  (['typography', 'typographyDesktop', 'typographyTablet', 'typographyMobile'] as const).forEach((group) => {
    const tokens = theme.tokens[group];
    if (!tokens) return;
    const target = next[group] ?? {};
    Object.entries(tokens).forEach(([prop, token]) => {
      if (!token) return;
      (target as Record<string, string>)[prop] = token;
    });
    next[group] = target as never;
  });

  return pruneTypography(next);
}

export function clearTextThemeFromOverrides(overrides: StyleOverrides | undefined): StyleOverrides {
  const base = overrides ? { ...overrides } : {};
  const next: StyleOverrides = {
    ...base,
    typography: base.typography ? { ...base.typography } : undefined,
    typographyDesktop: base.typographyDesktop ? { ...base.typographyDesktop } : undefined,
    typographyTablet: base.typographyTablet ? { ...base.typographyTablet } : undefined,
    typographyMobile: base.typographyMobile ? { ...base.typographyMobile } : undefined,
    color: base.color ? { ...base.color } : base.color,
    effects: base.effects ? { ...base.effects } : base.effects,
  };

  if (next.typography) {
    delete next.typography.fontFamily;
    delete next.typography.fontSize;
    delete next.typography.fontWeight;
    delete next.typography.lineHeight;
  }
  if (next.typographyDesktop) {
    delete next.typographyDesktop.fontSize;
    delete next.typographyDesktop.lineHeight;
  }
  if (next.typographyTablet) {
    delete next.typographyTablet.fontSize;
    delete next.typographyTablet.lineHeight;
  }
  if (next.typographyMobile) {
    delete next.typographyMobile.fontSize;
    delete next.typographyMobile.lineHeight;
  }

  return pruneTypography(next);
}

export function getAppliedTextTheme(
  overrides: StyleOverrides | undefined,
  themes: TextTheme[],
): TextTheme | null {
  if (!overrides) return null;
  return (
    themes.find((theme) => {
      return (['typography', 'typographyDesktop', 'typographyTablet', 'typographyMobile'] as const).every((group) => {
        const tokens = theme.tokens[group];
        if (!tokens) return true;
        const current = overrides[group];
        if (!current) return false;
        return Object.entries(tokens).every(([prop, token]) => (current as Record<string, string | undefined>)[prop] === token);
      });
    }) ?? null
  );
}

export function toCssValue(token: string | undefined): string | undefined {
  if (!token) return undefined;
  return token.startsWith("--") ? `var(${token})` : token;
}
