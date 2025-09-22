import {
  applyTextThemeToOverrides,
  clearTextThemeFromOverrides,
  extractTextThemes,
  getAppliedTextTheme,
  toCssValue,
} from "../textThemes";

describe("textThemes", () => {
  const sampleTokens = {
    "--text-heading-font-size": "32px",
    "--text-heading-line-height": "40px",
    "--text-heading-font-weight": "700",
    "--text-heading-font-family": "var(--font-heading)",
    "--text-heading-font-size-desktop": "36px",
    "--text-heading-line-height-desktop": "42px",
    "--text-heading-font-size-tablet": "34px",
    "--text-heading-line-height-tablet": "40px",
    "--text-body-font-size": "16px",
    "--text-body-line-height": "24px",
    "--text-body-font-weight": "400",
    "--typography-body-font-family": "var(--font-body)",
  } as Record<string, string>;

  it("extracts themes from token map", () => {
    const themes = extractTextThemes(sampleTokens);
    expect(themes).toHaveLength(2);
    expect(themes[0].id).toBe("body");
    expect(themes[0].label).toBe("Body");
    expect(themes[0].tokens.typography).toEqual({
      fontSize: "--text-body-font-size",
      lineHeight: "--text-body-line-height",
      fontWeight: "--text-body-font-weight",
      fontFamily: "--typography-body-font-family",
    });
    expect(themes[1].tokens.typographyDesktop).toEqual({
      fontSize: "--text-heading-font-size-desktop",
      lineHeight: "--text-heading-line-height-desktop",
    });
  });

  it("applies a theme to overrides", () => {
    const [bodyTheme] = extractTextThemes(sampleTokens);
    const next = applyTextThemeToOverrides(undefined, bodyTheme);
    expect(next.typography).toEqual({
      fontSize: "--text-body-font-size",
      lineHeight: "--text-body-line-height",
      fontWeight: "--text-body-font-weight",
      fontFamily: "--typography-body-font-family",
    });
  });

  it("clears typography overrides", () => {
    const [bodyTheme, headingTheme] = extractTextThemes(sampleTokens);
    let next = applyTextThemeToOverrides(undefined, headingTheme);
    next = applyTextThemeToOverrides(next, bodyTheme);
    const cleared = clearTextThemeFromOverrides(next);
    expect(cleared.typography).toBeUndefined();
    expect(cleared.typographyDesktop).toBeUndefined();
  });

  it("detects the currently applied theme", () => {
    const themes = extractTextThemes(sampleTokens);
    const overrides = applyTextThemeToOverrides(undefined, themes[1]);
    const active = getAppliedTextTheme(overrides, themes);
    expect(active?.id).toBe("heading");
  });

  it("normalises CSS values when building previews", () => {
    expect(toCssValue("--text-body-font-size")).toBe("var(--text-body-font-size)");
    expect(toCssValue("700")).toBe("700");
    expect(toCssValue(undefined)).toBeUndefined();
  });
});
