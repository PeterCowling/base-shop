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

  it("loads tokens from theme package", async () => {
    await expect(loadThemeTokens("brandx")).resolves.toEqual({ "--color-bg": "purple" });
  });

  it("loads tokens from tailwind tokens when theme import fails", async () => {
    await expect(loadThemeTokens("dummy")).resolves.toEqual({ "--color-bg": "green" });
  });
});

