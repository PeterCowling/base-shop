// apps/cms/__tests__/tokenUtils.test.ts
/* eslint-env jest */

import { baseTokens, loadThemeTokens } from "../src/app/cms/wizard/tokenUtils";

describe("tokenUtils", () => {
  it("exposes baseTokens", () => {
    expect(baseTokens["--color-bg"]).toBeDefined();
  });

  it("returns base tokens for base theme", async () => {
    await expect(loadThemeTokens("base")).resolves.toEqual(baseTokens);
  });

  it("falls back to base tokens for unknown theme", async () => {
    await expect(loadThemeTokens("nope")).resolves.toEqual(baseTokens);
  });
});
