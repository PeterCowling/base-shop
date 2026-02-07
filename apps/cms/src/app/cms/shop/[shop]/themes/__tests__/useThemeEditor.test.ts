import { act,renderHook } from "@testing-library/react";

import { patchShopTheme } from "../../../../wizard/services/patchTheme";
import { useThemeEditor } from "../useThemeEditor";

jest.mock("../../../../wizard/services/patchTheme", () => ({
  patchShopTheme: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../wizard/previewTokens", () => ({
  savePreviewTokens: jest.fn(),
}));

jest.mock("../useThemePresetManager", () => ({
  useThemePresetManager: jest.fn((args) => {
    const React = require("react");
    const [theme, setTheme] = React.useState(args.initialTheme);
    const [overrides, setOverrides] = React.useState(args.initialOverrides);
    return {
      theme,
      setTheme,
      overrides,
      setOverrides,
      availableThemes: args.themes,
      tokensByThemeState: args.tokensByTheme,
      presetThemes: [],
      presetName: "",
      setPresetName: jest.fn(),
      handleSavePreset: jest.fn(),
      handleDeletePreset: jest.fn(),
      handleThemeChange: jest.fn(),
    };
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
