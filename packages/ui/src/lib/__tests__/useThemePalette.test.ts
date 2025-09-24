// packages/ui/src/lib/__tests__/useThemePalette.test.ts
import useThemePalette, { mapTokensToCssVars, defaultPalette } from "../useThemePalette";

describe("useThemePalette and mapTokensToCssVars", () => {
  test("exposes matrix, defaultPalette and mapper", () => {
    const api = useThemePalette();
    expect(api).toHaveProperty("matrix");
    expect(api).toHaveProperty("defaultPalette");
    expect(api).toHaveProperty("mapTokensToCssVars");
  });

  test("maps semantic tokens to expected HSL components (light)", () => {
    const vars = mapTokensToCssVars(defaultPalette, "light");
    // A few spot checks across families and helpers
    expect(vars["--color-bg-1"]).toBe(defaultPalette.neutral[1]);
    expect(vars["--color-border"]).toBe(defaultPalette.neutral[6]);
    expect(vars["--color-primary"]).toBe(defaultPalette.primary[9]);
    expect(vars["--color-accent-soft"]).toBe(defaultPalette.accent[3]);
    expect(vars["--color-warning"]).toBe(defaultPalette.warning[9]);
    expect(vars["--color-link"]).toBe(defaultPalette.primary[9]);
  });

  test("automatic foreground picks neutral[12] in light, neutral[1] in dark", () => {
    const light = mapTokensToCssVars(defaultPalette, "light");
    const dark = mapTokensToCssVars(defaultPalette, "dark");
    expect(light["--color-primary-fg"]).toBe(defaultPalette.neutral[12]);
    expect(dark["--color-primary-fg"]).toBe(defaultPalette.neutral[1]);
    expect(light["--color-accent-fg"]).toBe(defaultPalette.neutral[12]);
    expect(dark["--color-accent-fg"]).toBe(defaultPalette.neutral[1]);
  });

  test("respects per-mode overrides for selection/highlight", () => {
    const light = mapTokensToCssVars(defaultPalette, "light");
    const dark = mapTokensToCssVars(defaultPalette, "dark");
    // selection uses accent with light:4, dark:8
    expect(light["--color-selection"]).toBe(defaultPalette.accent[4]);
    expect(dark["--color-selection"]).toBe(defaultPalette.accent[8]);
    // highlight uses accent with light:3, dark:7
    expect(light["--color-highlight"]).toBe(defaultPalette.accent[3]);
    expect(dark["--color-highlight"]).toBe(defaultPalette.accent[7]);
  });
});

