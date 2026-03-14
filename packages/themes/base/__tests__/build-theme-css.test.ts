/**
 * Tests for generateThemeCSS() — the theme CSS bridge compiler.
 *
 * Covers:
 * - darkSelector: configurable dark mode CSS selector (TASK-01)
 * - tokenVarMap: flat token map entries with light/dark values (TASK-02)
 * - Backward compatibility: no config changes → identical output
 */

import { generateThemeCSS, type ThemeCSSConfig } from "../src/build-theme-css";
import type { DesignProfile, ThemeAssets } from "../src/theme-expression";

// ---------------------------------------------------------------------------
// Minimal fixtures — just enough to exercise the compiler
// ---------------------------------------------------------------------------

const minimalAssets: ThemeAssets = {
  fonts: {
    body: { family: "Inter, sans-serif", source: "google", weights: [400, 700] },
  },
  gradients: {},
  shadows: {},
  keyframes: {},
  brandColors: {
    primary: { light: "#1a5c2e", dark: "#3cb371" },
    bg: "#ffffff",
  },
};

const minimalProfile: DesignProfile = {
  motion: { durationNormal: "200ms" },
} as DesignProfile;

const baseConfig: ThemeCSSConfig = {
  assets: minimalAssets,
  profile: minimalProfile,
  colorVarMap: { primary: "brand-primary", bg: "brand-bg" },
  fontVarMap: { body: "font-sans" },
};

// ---------------------------------------------------------------------------
// darkSelector tests (TASK-01)
// ---------------------------------------------------------------------------

describe("darkSelector", () => {
  test("TC-01: no darkSelector → output contains .dark {", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: baseConfig,
    });

    expect(css).toContain(".dark {");
    expect(css).not.toContain("html.theme-dark {");
  });

  test("TC-02: darkSelector html.theme-dark → output uses that selector", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: { ...baseConfig, darkSelector: "html.theme-dark" },
    });

    expect(css).toContain("html.theme-dark {");
    expect(css).not.toContain(".dark {");
  });

  test("TC-03: darkSelector explicitly .dark → same as default", () => {
    const defaultCSS = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: baseConfig,
    });

    const explicitCSS = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: { ...baseConfig, darkSelector: ".dark" },
    });

    expect(explicitCSS).toBe(defaultCSS);
  });
});

// ---------------------------------------------------------------------------
// tokenVarMap tests (TASK-02)
// ---------------------------------------------------------------------------

describe("tokenVarMap", () => {
  test("TC-04: light-only entries appear in :root, not in dark block", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: {
        ...baseConfig,
        tokenVarMap: {
          "--color-surface": { light: "0 0% 100%" },
          "--color-panel": { light: "150 4% 97%" },
        },
      },
    });

    // Should appear in :root
    expect(css).toContain("--color-surface: 0 0% 100%;");
    expect(css).toContain("--color-panel: 150 4% 97%;");

    // Extract dark block and verify these vars are NOT in it
    const darkBlockMatch = css.match(/\.dark \{([\s\S]*?)\n\}/);
    expect(darkBlockMatch).toBeTruthy();
    const darkBlock = darkBlockMatch![1];
    expect(darkBlock).not.toContain("--color-surface:");
    expect(darkBlock).not.toContain("--color-panel:");
  });

  test("TC-05: light+dark entries appear in both blocks", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: {
        ...baseConfig,
        tokenVarMap: {
          "--color-primary": { light: "142 72% 30%", dark: "142 55% 48%" },
        },
      },
    });

    // Root block should have light value
    const rootMatch = css.match(/:root \{([\s\S]*?)\n\}/);
    expect(rootMatch).toBeTruthy();
    expect(rootMatch![1]).toContain("--color-primary: 142 72% 30%;");

    // Dark block should have dark value
    const darkMatch = css.match(/\.dark \{([\s\S]*?)\n\}/);
    expect(darkMatch).toBeTruthy();
    expect(darkMatch![1]).toContain("--color-primary: 142 55% 48%;");
  });

  test("TC-06: mixed light-only and light+dark entries distribute correctly", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: {
        ...baseConfig,
        tokenVarMap: {
          "--font-sans": { light: "var(--font-inter)" },
          "--color-bg": { light: "0 0% 100%", dark: "160 8% 4%" },
          "--color-fg": { light: "0 0% 10%", dark: "150 10% 92%" },
        },
      },
    });

    // All three in :root
    expect(css).toContain("--font-sans: var(--font-inter);");
    expect(css).toContain("--color-bg: 0 0% 100%;");
    expect(css).toContain("--color-fg: 0 0% 10%;");

    // Only two in dark block
    const darkMatch = css.match(/\.dark \{([\s\S]*?)\n\}/);
    expect(darkMatch).toBeTruthy();
    const darkBlock = darkMatch![1];
    expect(darkBlock).toContain("--color-bg: 160 8% 4%;");
    expect(darkBlock).toContain("--color-fg: 150 10% 92%;");
    expect(darkBlock).not.toContain("--font-sans:");
  });

  test("TC-07: no tokenVarMap → output identical to baseline", () => {
    const withoutTokenMap = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: baseConfig,
    });

    const withEmptyTokenMap = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: { ...baseConfig, tokenVarMap: undefined },
    });

    expect(withEmptyTokenMap).toBe(withoutTokenMap);
  });

  test("TC-08: tokenVarMap keys with -- prefix are emitted verbatim", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: {
        ...baseConfig,
        tokenVarMap: {
          "--color-pinkShades-row1": { light: "330 55% 66%" },
        },
      },
    });

    // Should NOT have ----color (double prefix)
    expect(css).not.toContain("----color");
    // Should have exactly --color-pinkShades-row1
    expect(css).toContain("  --color-pinkShades-row1: 330 55% 66%;");
  });
});

// ---------------------------------------------------------------------------
// Combined features
// ---------------------------------------------------------------------------

describe("darkSelector + tokenVarMap together", () => {
  test("custom selector with token map entries", () => {
    const css = generateThemeCSS({
      assets: minimalAssets,
      profile: minimalProfile,
      config: {
        ...baseConfig,
        darkSelector: "html.theme-dark",
        tokenVarMap: {
          "--color-accent": { light: "36 90% 50%", dark: "36 85% 58%" },
        },
      },
    });

    expect(css).toContain("html.theme-dark {");
    expect(css).not.toContain(".dark {");

    const darkMatch = css.match(/html\.theme-dark \{([\s\S]*?)\n\}/);
    expect(darkMatch).toBeTruthy();
    expect(darkMatch![1]).toContain("--color-accent: 36 85% 58%;");
  });
});
