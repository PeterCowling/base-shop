import { syncTheme } from "@acme/platform-core/createShop";
import { loadThemeTokens } from "@acme/platform-core/themeTokens";

import { buildThemeData, mergeThemePatch,removeThemeToken } from "../theme";

jest.mock("@acme/platform-core/createShop", () => ({
  syncTheme: jest.fn().mockResolvedValue({ a: "1" }),
}));
jest.mock("@acme/platform-core/themeTokens", () => ({
  baseTokens: { base: "z" },
  loadThemeTokens: jest.fn().mockResolvedValue({ a: "0" }),
}));

const syncThemeMock = syncTheme as jest.MockedFunction<typeof syncTheme>;
const loadThemeTokensMock =
  loadThemeTokens as jest.MockedFunction<typeof loadThemeTokens>;

describe("theme service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes theme data when theme id changes", async () => {
    const form: any = {
      themeOverrides: { b: "2" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t2" };
    const result = await buildThemeData("shop", form, current);
    expect(syncThemeMock).toHaveBeenCalledWith("shop", "t1");
    expect(loadThemeTokensMock).not.toHaveBeenCalled();
    expect(result.themeTokens).toEqual({ a: "1", b: "2" });
  });

  it("loads theme tokens when theme id remains the same", async () => {
    const form: any = {
      themeOverrides: { b: "2" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t1" };
    const result = await buildThemeData("shop", form, current);
    expect(loadThemeTokensMock).toHaveBeenCalledWith("t1");
    expect(syncThemeMock).not.toHaveBeenCalled();
    expect(result.themeTokens).toEqual({ base: "z", a: "0", b: "2" });
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

  it("merges partial theme updates removing null or matching overrides", () => {
    const current: any = {
      themeOverrides: { a: "1", b: "2" },
      themeDefaults: { a: "0", b: "0", c: "3", d: "4" },
    };
    const patch = mergeThemePatch(current, { b: "4", c: "3", d: null as any }, {});
    expect(patch.overrides).toEqual({ a: "1", b: "4" });
    expect(patch.themeTokens).toEqual({ a: "1", b: "4", c: "3", d: "4" });
  });
});
