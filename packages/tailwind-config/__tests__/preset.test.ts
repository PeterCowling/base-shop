import { jest } from "@jest/globals";

it("exports preset and prints diagnostic message", async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const { default: preset } = await import("../src/index.ts");

  expect((preset.theme?.extend?.colors as Record<string, string>)["bg"]).toBe(
    "hsl(var(--color-bg))"
  );
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

  const extend = (preset.theme?.extend ?? {}) as Record<string, any>;
  expect(extend.textColor).toEqual(
    expect.objectContaining({
      "primary-foreground": "hsl(var(--color-primary-fg))",
    })
  );
  expect(extend.fontFamily).toEqual(
    expect.objectContaining({ sans: "var(--font-sans)", mono: "var(--font-mono)" })
  );
  expect(extend.spacing).toEqual(
    expect.objectContaining({ 1: "var(--space-1)" })
  );
  expect(extend.borderRadius).toEqual(
    expect.objectContaining({ sm: "var(--radius-sm)" })
  );
  expect(extend.boxShadow).toEqual(
    expect.objectContaining({
      sm: "var(--shadow-sm)",
      "elevation-3": expect.stringContaining("var(--elevation-3")
    })
  );
  // Background images include hero and contrast-safe variant
  expect(extend.backgroundImage).toEqual(
    expect.objectContaining({
      hero: expect.stringContaining("linear-gradient"),
      "hero-contrast": expect.stringContaining("linear-gradient"),
    })
  );
});
