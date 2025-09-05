// apps/cms/__tests__/tokenUtils.test.ts
/* eslint-env jest */

import { baseTokens, loadThemeTokens } from "../src/app/cms/wizard/tokenUtils";

describe("tokenUtils", () => {
  it("exposes baseTokens", () => {
    expect(baseTokens["--color-bg"]).toBeDefined();
  });

  it.each([
    ["base", baseTokens],
    ["nope", baseTokens],
  ])("loads tokens for %s theme", async (theme, expected) => {
    await expect(loadThemeTokens(theme)).resolves.toEqual(expected);
  });
});
