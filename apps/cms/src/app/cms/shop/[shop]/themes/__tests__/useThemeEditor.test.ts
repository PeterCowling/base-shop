import { renderHook, act } from "@testing-library/react";
import { useThemeEditor } from "../useThemeEditor";
import { patchShopTheme } from "../../../../wizard/services/patchTheme";

jest.mock("../../../../wizard/services/patchTheme", () => ({
  patchShopTheme: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../wizard/previewTokens", () => ({
  savePreviewTokens: jest.fn(),
}));

jest.mock("../useThemePresets", () => ({
  useThemePresets: jest.fn().mockReturnValue({
    availableThemes: ["base"],
    tokensByThemeState: { base: { color: "#fff" } },
    presetThemes: [],
    presetName: "",
    setPresetName: jest.fn(),
    handleSavePreset: jest.fn(),
    handleDeletePreset: jest.fn(),
  }),
}));

describe("useThemeEditor", () => {
  const baseArgs = {
    shop: "shop1",
    themes: ["base"],
    tokensByTheme: { base: { color: "#fff" } },
    initialTheme: "base",
    initialOverrides: {},
    presets: [],
  };

  it("updates overrides and persists", () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useThemeEditor(baseArgs));

    act(() => {
      result.current.handleOverrideChange("color", "#fff")("#000");
    });
    expect(result.current.overrides.color).toBe("#000");

    act(() => {
      jest.runAllTimers();
    });
    expect(patchShopTheme).toHaveBeenCalledWith("shop1", {
      themeOverrides: { color: "#000" },
      themeDefaults: {},
    });

    act(() => {
      result.current.handleReset("color")();
    });
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.overrides.color).toBeUndefined();
    expect(patchShopTheme).toHaveBeenLastCalledWith("shop1", {
      themeOverrides: { color: "#fff" },
      themeDefaults: {},
    });
    jest.useRealTimers();
  });
});
