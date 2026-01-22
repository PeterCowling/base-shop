import { act, renderHook } from "@testing-library/react";

import { patchShopTheme } from "../../../../wizard/services/patchTheme";
import { useThemePresetManager } from "../useThemePresetManager";

jest.mock("../../../../wizard/services/patchTheme", () => ({
  patchShopTheme: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../useThemePresets", () => ({
  useThemePresets: jest.fn(({ initialThemes, initialTokensByTheme, presets }) => ({
    availableThemes: initialThemes,
    tokensByThemeState: initialTokensByTheme,
    presetThemes: presets,
    presetName: "",
    setPresetName: jest.fn(),
    handleSavePreset: jest.fn(),
    handleDeletePreset: jest.fn(),
  })),
}));

describe("useThemePresetManager", () => {
  const baseArgs = {
    shop: "shop1",
    themes: ["base", "bcd", "preset1"],
    tokensByTheme: {
      base: { "--color-primary": "0 0% 100%" },
      bcd: { "--color-primary": "220 90% 56%" },
      preset1: { "--color-primary": "120 60% 40%" },
    },
    initialTheme: "base",
    initialOverrides: { "--color-primary": "1 2% 3%" },
    presets: ["preset1"],
  };

  it("persists built-in theme selection", async () => {
    const { result } = renderHook(() => useThemePresetManager(baseArgs));
    await act(async () => {
      result.current.handleThemeChange({
        target: { value: "bcd" },
      } as unknown as React.ChangeEvent<HTMLSelectElement>);
    });
    expect(patchShopTheme).toHaveBeenCalledWith("shop1", { themeId: "bcd" });
  });

  it("does not persist preset selection as themeId", async () => {
    const { result } = renderHook(() => useThemePresetManager(baseArgs));
    (patchShopTheme as jest.Mock).mockClear();
    await act(async () => {
      result.current.handleThemeChange({
        target: { value: "preset1" },
      } as unknown as React.ChangeEvent<HTMLSelectElement>);
    });
    expect(patchShopTheme).not.toHaveBeenCalled();
  });
});

