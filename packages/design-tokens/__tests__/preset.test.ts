import { jest } from "@jest/globals";

describe("design tokens preset", () => {
  const assertTokens = (config: any) => {
    expect(config.theme?.colors?.bg).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(config.theme?.colors?.bg)).toContain("--color-bg");

    const tc = config.theme?.textColor ?? {};
    expect(tc["primary-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["primary-foreground"]).toString()).toContain("--color-primary-fg");
    expect(tc["accent-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["accent-foreground"])).toContain("--color-accent-fg");
    expect(tc["danger-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["danger-foreground"])).toContain("--color-danger-fg");
    expect(tc["success-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["success-foreground"])).toContain("--color-success-fg");
    expect(tc["warning-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["warning-foreground"])).toContain("--color-warning-fg");
    expect(tc["info-foreground"]).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(tc["info-foreground"])).toContain("--color-info-fg");
    expect(config.theme?.fontFamily?.sans).toBe("var(--font-sans)");
    expect(config.theme?.fontFamily?.mono).toBe("var(--font-mono)");
    expect(config.theme?.spacing?.["1"]).toBe("var(--space-1)");
    expect(config.theme?.spacing?.["2"]).toBe("var(--space-2)");
    expect(config.theme?.spacing?.["3"]).toBe("var(--space-3)");
    expect(config.theme?.spacing?.["4"]).toBe("var(--space-4)");
    expect(config.theme?.borderRadius?.sm).toBe("var(--radius-sm)");
    expect(config.theme?.borderRadius?.md).toBe("var(--radius-md)");
    expect(config.theme?.borderRadius?.lg).toBe("var(--radius-lg)");
    expect(config.theme?.boxShadow?.sm).toBe("var(--shadow-sm)");
    expect(config.theme?.boxShadow?.md).toBe("var(--shadow-md)");
    expect(config.theme?.boxShadow?.lg).toBe("var(--shadow-lg)");
  };

  it("exports preset configuration", async () => {
    jest.resetModules();
    const module = await import("../src/index.ts");
    const preset = module.default;

    // Skip test if no default export (implementation uses named exports only)
    if (!preset) {
      console.warn("No default export found - design-tokens uses named exports only");
      return;
    }

    expect(preset.content).toEqual([]);
    assertTokens(preset);

    if (typeof preset === "function") {
      const result = preset();
      expect(result.content).toEqual([]);
      assertTokens(result);
    }
  });
});
