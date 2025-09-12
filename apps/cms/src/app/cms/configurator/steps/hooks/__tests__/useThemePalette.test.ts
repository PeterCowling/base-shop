import { renderHook, waitFor } from "@testing-library/react";
import { useThemePalette } from "../useThemePalette";
import { useConfigurator } from "../../../ConfiguratorContext";

jest.mock("../../../ConfiguratorContext", () => ({
  useConfigurator: jest.fn(),
}));

describe("useThemePalette", () => {
  const basePalette = {
    "--color-bg": "0 0% 100%",
    "--color-fg": "0 0% 10%",
    "--color-primary": "220 90% 56%",
    "--color-primary-fg": "0 0% 100%",
    "--color-accent": "260 83% 67%",
    "--color-muted": "0 0% 88%",
  };

  let overrides: Record<string, string>;
  let setThemeOverrides: jest.Mock;
  let themeDefaults: Record<string, string>;

  const setup = () => {
    overrides = {};
    setThemeOverrides = jest.fn((arg) => {
      overrides = typeof arg === "function" ? arg(overrides) : arg;
    });
    (useConfigurator as jest.Mock).mockReturnValue({
      themeDefaults,
      themeOverrides: overrides,
      setThemeOverrides,
    });
    return renderHook(() => useThemePalette());
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generates default palette", async () => {
    themeDefaults = {
      "--color-bg": "1 1% 1%",
      "--color-fg": "1 1% 1%",
      "--color-primary": "1 1% 1%",
      "--color-primary-fg": "1 1% 1%",
      "--color-accent": "1 1% 1%",
      "--color-muted": "1 1% 1%",
    };
    const { result } = setup();
    await waitFor(() =>
      expect(overrides).toEqual(result.current.colorPalettes[0].colors),
    );
  });

  it("updates palette when tokens change", () => {
    themeDefaults = { ...basePalette };
    const { result } = setup();
    expect(overrides).toEqual({});
    result.current.handleTokenChange({
      "--color-bg": "10 10% 10%",
      "--color-primary": basePalette["--color-primary"],
    } as any);
    expect(overrides).toEqual({ "--color-bg": "10 10% 10%" });
  });

  it("handles invalid colors gracefully", () => {
    themeDefaults = { ...basePalette };
    const { result } = setup();
    expect(() =>
      result.current.handleTokenChange({
        "--color-bg": "not-a-color",
      } as any),
    ).not.toThrow();
    expect(overrides).toEqual({ "--color-bg": "not-a-color" });
  });
});

