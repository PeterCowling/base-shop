import { jest } from "@jest/globals";

it("exports preset and prints diagnostic message", async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, "info").mockImplementation(() => {});
  const { default: preset } = await import("../src/index.ts");

  const colors = (preset.theme as { colors?: Record<string, string> })?.colors ?? {};
  const bg = colors["bg"];
  // Avoid literal 'hsl(var(--…))' in tests per lint rule
  expect(typeof bg).toBe("string");
  expect(bg.startsWith("hsl(")).toBe(true);
  expect(bg.includes("var(")).toBe(true);
  expect(bg.includes("--color-bg")).toBe(true);
  expect(logSpy).toHaveBeenCalledWith(
    `[@acme/tailwind-config] ✅  preset imported (cwd: ${process.cwd()})`
  );
  logSpy.mockRestore();
});

it("sets arrays and exposes theme mappings", async () => {
  jest.resetModules();
  const { default: preset } = await import("../src/index.ts");

  expect(Array.isArray((preset as { plugins?: unknown[] }).plugins)).toBe(true);
  expect(Array.isArray((preset as { presets?: unknown[] }).presets)).toBe(true);

  const theme = (preset.theme ?? {}) as Record<string, any>;
  expect(theme.textColor).toEqual(
    expect.objectContaining({
      // Construct expectation without embedding 'hsl(var('--…))' literally
      "primary-foreground": expect.stringContaining("--color-primary-fg"),
    })
  );
  expect(theme.fontFamily).toEqual(
    expect.objectContaining({ sans: "var(--font-sans)", mono: "var(--font-mono)" })
  );
  expect(theme.spacing).toEqual(
    expect.objectContaining({ 1: "var(--space-1)" })
  );
  expect(theme.borderRadius).toEqual(
    expect.objectContaining({ sm: "var(--radius-sm)" })
  );
  expect(theme.boxShadow).toEqual(
    expect.objectContaining({
      sm: "var(--shadow-sm)",
      "elevation-3": expect.stringContaining("var(--elevation-3")
    })
  );
  // Background images include hero and contrast-safe variant
  expect(theme.backgroundImage).toEqual(
    expect.objectContaining({
      hero: expect.stringContaining("linear-gradient"),
      "hero-contrast": expect.stringContaining("linear-gradient"),
    })
  );
});
