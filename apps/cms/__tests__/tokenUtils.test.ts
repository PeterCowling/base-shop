import { baseTokens, loadThemeTokens } from "../src/app/cms/wizard/tokenUtils";

describe("tokenUtils", () => {
  it("uses light values for base tokens", () => {
    expect(baseTokens["--color-bg"]).toBe("0 0% 100%");
  });

  it("loads base tokens when theme is missing or base", async () => {
    await expect(loadThemeTokens("base")).resolves.toEqual(baseTokens);
    await expect(loadThemeTokens(""))
      .resolves.toEqual(baseTokens);
  });

  it("falls back to base tokens for unknown themes", async () => {
    await expect(loadThemeTokens("unknown"))
      .resolves.toEqual(baseTokens);
  });
});
