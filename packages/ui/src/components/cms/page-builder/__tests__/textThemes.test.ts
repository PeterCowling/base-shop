import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import {
  applyTextThemeToOverrides,
  extractTextThemes,
  matchTextTheme,
} from "../textThemes";

describe("textThemes helpers", () => {
  const tokens = {
    "--font-size-heading-lg": "var(--font-size-heading-lg)",
    "--line-height-heading-lg": "var(--line-height-heading-lg)",
    "--font-weight-heading-lg": "var(--font-weight-heading-lg)",
    "--font-family-heading-lg": "var(--font-family-heading-lg)",
    "--font-size-heading-lg-tablet": "var(--font-size-heading-lg-tablet)",
    "--line-height-heading-lg-tablet": "var(--line-height-heading-lg-tablet)",
  } as Record<string, string>;

  it("extracts grouped text themes from token map", () => {
    const themes = extractTextThemes(tokens);
    expect(themes).toHaveLength(1);
    const theme = themes[0];
    expect(theme.id).toBe("heading-lg");
    expect(theme.label).toBe("Heading LG");
    expect(theme.tokens.base).toMatchObject({
      fontSize: "--font-size-heading-lg",
      lineHeight: "--line-height-heading-lg",
      fontWeight: "--font-weight-heading-lg",
      fontFamily: "--font-family-heading-lg",
    });
    expect(theme.tokens.tablet).toMatchObject({
      fontSize: "--font-size-heading-lg-tablet",
      lineHeight: "--line-height-heading-lg-tablet",
    });
  });

  it("applies a text theme to overrides and preserves non-typography fields", () => {
    const themes = extractTextThemes(tokens);
    const overrides: StyleOverrides = {
      color: { fg: "hsl(var(--color-fg))" },
      typography: { fontSize: "--old", lineHeight: "--old" },
    };
    const next = applyTextThemeToOverrides(overrides, themes[0]);
    expect(next.color).toEqual({ fg: "hsl(var(--color-fg))" });
    expect(next.typography).toEqual({
      fontSize: "--font-size-heading-lg",
      lineHeight: "--line-height-heading-lg",
      fontWeight: "--font-weight-heading-lg",
      fontFamily: "--font-family-heading-lg",
    });
    expect(next.typographyTablet).toEqual({
      fontSize: "--font-size-heading-lg-tablet",
      lineHeight: "--line-height-heading-lg-tablet",
    });
  });

  it("clears typography overrides when no theme is provided", () => {
    const overrides: StyleOverrides = {
      color: { fg: "hsl(var(--color-fg))" },
      typography: { fontSize: "--something" },
    };
    const next = applyTextThemeToOverrides(overrides, null);
    expect(next).toEqual({ color: { fg: "hsl(var(--color-fg))" } });
  });

  it("matches the currently applied text theme", () => {
    const themes = extractTextThemes(tokens);
    const overrides: StyleOverrides = {
      typography: {
        fontSize: "--font-size-heading-lg",
        lineHeight: "--line-height-heading-lg",
        fontWeight: "--font-weight-heading-lg",
        fontFamily: "--font-family-heading-lg",
      },
      typographyTablet: {
        fontSize: "--font-size-heading-lg-tablet",
        lineHeight: "--line-height-heading-lg-tablet",
      },
    };
    expect(matchTextTheme(overrides, themes)).toBe("heading-lg");
    overrides.typography = { fontSize: "--custom" };
    expect(matchTextTheme(overrides, themes)).toBeUndefined();
  });
});
