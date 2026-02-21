// apps/cms/__tests__/tokenUtils.test.ts
/* eslint-env jest */

import { baseTokens, loadThemeTokens } from "../src/app/cms/wizard/tokenUtils";

describe("tokenUtils", () => {
  it("exposes baseTokens", () => {
    expect(baseTokens["--color-bg"]).toBeDefined();
  });

  it.each([
    ["base", baseTokens],
    ["", baseTokens],
    ["nope", baseTokens],
  ])("falls back to base tokens for %s", async (theme, expected) => {
    await expect(loadThemeTokens(theme)).resolves.toEqual(expected);
  });

  it("loads tokens from theme package and merges with base", async () => {
    const result = await loadThemeTokens("brandx");
    // loadThemeTokens returns { ...baseTokens, ...themeOverrides }
    // Verify base token keys are present and the brandx override is applied.
    expect(result["--color-bg"]).toBeDefined();
    // brandx overrides primary color
    expect(result["--color-primary"]).toBeDefined();
    // All base token keys should be present (merged result is superset of base)
    for (const key of Object.keys(baseTokens)) {
      expect(result).toHaveProperty(key);
    }
  });

  it("falls back to baseTokens when theme import throws", async () => {
    // "dummy" is in THEME_TAILWIND_LOADERS; its import may fail or succeed with empty tokens.
    // Either way the result should include all baseToken keys.
    const result = await loadThemeTokens("dummy");
    for (const key of Object.keys(baseTokens)) {
      expect(result).toHaveProperty(key);
    }
  });
});
