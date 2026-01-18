import { renderHook, act } from "@testing-library/react";
import { useThemePresets } from "../useThemePresets";

jest.mock("../page", () => ({
  savePreset: jest.fn().mockResolvedValue(undefined),
  deletePreset: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../wizard/services/patchTheme", () => ({
  patchShopTheme: jest.fn().mockResolvedValue(undefined),
}));

describe("useThemePresets", () => {
  const baseArgs = {
    shop: "shop1",
    initialThemes: ["base"],
    initialTokensByTheme: { base: { color: "#fff" } },
    presets: [],
  };

  it("saves preset and updates state", async () => {
    const { result } = renderHook(() =>
      useThemePresets({
        ...baseArgs,
        theme: "base",
        overrides: { color: "#000" },
        setTheme: jest.fn(),
        setOverrides: jest.fn(),
        setThemeDefaults: jest.fn(),
      }),
    );

    act(() => result.current.setPresetName("custom"));
    await act(async () => {
      await result.current.handleSavePreset();
    });
    expect(result.current.availableThemes).toContain("custom");
    expect(result.current.presetThemes).toContain("custom");
    expect(result.current.tokensByThemeState.custom.color).toBe("#000");
  });

  it("deletes preset and updates state", async () => {
    const { result } = renderHook(() =>
      useThemePresets({
        shop: "shop1",
        initialThemes: ["base", "p1"],
        initialTokensByTheme: {
          base: { color: "#fff" },
          p1: { color: "#000" },
        },
        presets: ["p1"],
        theme: "p1",
        overrides: {},
        setTheme: jest.fn(),
        setOverrides: jest.fn(),
        setThemeDefaults: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.handleDeletePreset();
    });
    expect(result.current.availableThemes).not.toContain("p1");
    expect(result.current.presetThemes).not.toContain("p1");
  });
});
