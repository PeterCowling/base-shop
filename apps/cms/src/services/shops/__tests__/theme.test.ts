import { syncTheme } from "@acme/platform-core/createShop";
import { loadThemeTokens } from "@acme/platform-core/themeTokens";

import { buildThemeData, mergeThemePatch, removeThemeToken } from "../theme";

jest.mock("@acme/platform-core/createShop", () => ({
  syncTheme: jest.fn().mockResolvedValue({
    "--color-bg": "0 0% 100%",
    "--color-fg": "0 0% 10%",
  }),
}));
jest.mock("@acme/platform-core/themeTokens", () => ({
  baseTokens: {
    "--color-bg": "0 0% 100%",
    "--color-fg": "0 0% 10%",
  },
  loadThemeTokens: jest.fn().mockResolvedValue({
    "--color-primary": "220 90% 56%",
  }),
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
      themeOverrides: { "--radius-md": "10px" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t2" };
    const result = await buildThemeData("shop", form, current);
    expect(syncThemeMock).toHaveBeenCalledWith("shop", "t1");
    expect(loadThemeTokensMock).not.toHaveBeenCalled();
    expect(result.themeTokens).toEqual({
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--radius-md": "10px",
    });
  });

  it("loads theme tokens when theme id remains the same", async () => {
    const form: any = {
      themeOverrides: { "--radius-md": "10px" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t1" };
    const result = await buildThemeData("shop", form, current);
    expect(loadThemeTokensMock).toHaveBeenCalledWith("t1");
    expect(syncThemeMock).not.toHaveBeenCalled();
    expect(result.themeTokens).toEqual({
      "--color-bg": "0 0% 100%",
      "--color-fg": "0 0% 10%",
      "--color-primary": "220 90% 56%",
      "--radius-md": "10px",
    });
  });

  it("rejects unresolved color references in overrides", async () => {
    const form: any = {
      themeOverrides: { "--color-fg": "var(--missing-token)" },
      themeDefaults: {},
      themeId: "t1",
    };
    const current: any = { themeId: "t1" };

    await expect(buildThemeData("shop", form, current)).rejects.toThrow(
      "Theme validation failed",
    );
  });

  it("removes theme token", () => {
    const current: any = {
      themeOverrides: { "--radius-md": "10px", "--radius-lg": "12px" },
      themeDefaults: { "--radius-md": "8px" },
    };
    const result = removeThemeToken(current, "--radius-md");
    expect(result.overrides).toEqual({ "--radius-lg": "12px" });
    expect(result.themeTokens).toEqual({
      "--radius-md": "8px",
      "--radius-lg": "12px",
    });
  });

  it("merges partial theme updates removing null or matching overrides", () => {
    const current: any = {
      themeOverrides: { "--radius-md": "10px", "--radius-lg": "12px" },
      themeDefaults: {
        "--radius-md": "8px",
        "--radius-lg": "10px",
        "--radius-xl": "16px",
      },
    };
    const patch = mergeThemePatch(
      current,
      {
        "--radius-lg": "14px",
        "--radius-xl": "16px",
        "--radius-2xl": null as any,
      },
      {},
    );
    expect(patch.overrides).toEqual({
      "--radius-md": "10px",
      "--radius-lg": "14px",
    });
    expect(patch.themeTokens).toEqual({
      "--radius-md": "10px",
      "--radius-lg": "14px",
      "--radius-xl": "16px",
    });
  });
});
