import { buildThemeData, removeThemeToken } from "../theme";

jest.mock("@platform-core/src/createShop", () => ({
  syncTheme: jest.fn().mockResolvedValue({ a: "1" }),
  loadTokens: jest.fn().mockResolvedValue({ a: "0" }),
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

  it("merges partial updates", async () => {
    const form: any = {
      themeOverrides: { b: "2" },
      themeDefaults: { b: "1" },
      themeId: "t1",
    };
    const current: any = {
      themeId: "t1",
      themeDefaults: { a: "0", b: "1" },
      themeOverrides: { a: "1" },
    };
    const result = await buildThemeData("shop", form, current);
    expect(result.themeDefaults).toEqual({ a: "0", b: "1" });
    expect(result.overrides).toEqual({ a: "1", b: "2" });
    expect(result.themeTokens).toEqual({ a: "1", b: "2" });
  });

  it("removes overrides when value is null", async () => {
    const form: any = {
      themeOverrides: { a: null },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = {
      themeId: "t1",
      themeDefaults: { a: "0" },
      themeOverrides: { a: "1", b: "2" },
    };
    const result = await buildThemeData("shop", form, current);
    expect(result.overrides).toEqual({ b: "2" });
    expect(result.themeTokens).toEqual({ a: "0", b: "2" });
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
