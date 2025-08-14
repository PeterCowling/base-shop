import { buildThemeData, removeThemeToken } from "../theme";

jest.mock("@platform-core/src/createShop", () => ({
  syncTheme: jest.fn().mockResolvedValue({ a: "1" }),
  loadTokens: jest.fn().mockResolvedValue({ a: "0" }),
}));

describe("theme service", () => {
  it("computes theme data", async () => {
    const form: any = {
      themeOverrides: { b: "2" },
      themeDefaults: { c: "3" },
      themeId: "t1",
    };
    const current: any = {
      themeId: "t1",
      themeOverrides: { a: "1" },
      themeDefaults: { a: "0" },
    };
    const result = await buildThemeData("shop", form, current);
    expect(result.overrides).toEqual({ a: "1", b: "2" });
    expect(result.themeDefaults).toEqual({ a: "0", c: "3" });
    expect(result.themeTokens).toEqual({ a: "1", b: "2", c: "3" });
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
});
