import { patchTheme, resetThemeOverride } from "../themeService";
import { authorize } from "../authorization";
import { fetchShop, persistShop } from "../persistence";
import { mergeThemePatch, removeThemeToken } from "../theme";
import { revalidatePath } from "next/cache";

jest.mock("../authorization", () => ({ authorize: jest.fn() }));
jest.mock("../persistence", () => ({
  fetchShop: jest.fn().mockResolvedValue({ id: "1" }),
  persistShop: jest.fn().mockResolvedValue({ id: "1" }),
}));
jest.mock("../theme", () => ({
  mergeThemePatch: jest.fn().mockReturnValue({
    themeDefaults: {},
    overrides: { a: "1" },
    themeTokens: { a: "1" },
  }),
  removeThemeToken: jest.fn().mockReturnValue({
    overrides: {},
    themeTokens: {},
  }),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

describe("themeService", () => {
  it("patches theme and persists", async () => {
    const result = await patchTheme("shop", {
      themeOverrides: { a: "1" },
      themeDefaults: {},
    });
    expect(authorize).toHaveBeenCalled();
    expect(mergeThemePatch).toHaveBeenCalled();
    expect(persistShop).toHaveBeenCalled();
    expect(result.shop).toBeDefined();
  });

  it("resets theme override", async () => {
    await resetThemeOverride("shop", "a");
    expect(removeThemeToken).toHaveBeenCalled();
    expect(persistShop).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
  });
});
