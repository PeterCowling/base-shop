import { buildThemeData, removeThemeToken, mergeThemePatch } from "../theme";

jest.mock("@platform-core/src/createShop", () => ({
  syncTheme: jest.fn().mockResolvedValue({ a: "1" }),
}));
jest.mock("@platform-core/themeTokens", () => ({
  baseTokens: {},
  loadThemeTokens: jest.fn().mockResolvedValue({ a: "0" }),
}));

describe("theme service", () => {
  it("computes theme data", async () => {
    const form: any = {
      themeOverrides: { b: "2" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t2" };
    const result = await buildThemeData("shop", form, current);
    expect(result.themeTokens).toEqual({ a: "1", b: "2" });
  });

  it("removes theme token", () => {
    const current: any = {
      themeOverrides: { a: "1", b: "2" },
      themeDefaults: { a: "0" },
    };
    const result = removeThemeToken(current, "a");
    expect(result.overrides).toEqual({ b: "2" });
    expect(result.themeTokens).toEqual({ a: "0", b: "2" });
  });

  it("merges partial theme updates", () => {
    const current: any = {
      themeOverrides: { a: "1", b: "2" },
      themeDefaults: { a: "0", b: "0", c: "3" },
    };
    const patch = mergeThemePatch(current, { b: "4", c: "3" }, {});
    expect(patch.overrides).toEqual({ a: "1", b: "4" });
    expect(patch.themeTokens).toEqual({ a: "1", b: "4", c: "3" });
  });
});
