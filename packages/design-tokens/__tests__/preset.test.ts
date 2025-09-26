import { jest } from "@jest/globals";

describe("design tokens preset", () => {
  const assertTokens = (config: any) => {
    expect(config.theme?.colors?.bg).toBe("hsl(var(--color-bg))");
    expect(config.theme?.textColor?.["primary-foreground"]).toBe(
      "hsl(var(--color-primary-fg))",
    );
    expect(config.theme?.textColor?.["accent-foreground"]).toBe(
      "hsl(var(--color-accent-fg))",
    );
    expect(config.theme?.textColor?.["danger-foreground"]).toBe(
      "hsl(var(--color-danger-fg))",
    );
    expect(config.theme?.textColor?.["success-foreground"]).toBe(
      "hsl(var(--color-success-fg))",
    );
    expect(config.theme?.textColor?.["warning-foreground"]).toBe(
      "hsl(var(--color-warning-fg))",
    );
    expect(config.theme?.textColor?.["info-foreground"]).toBe(
      "hsl(var(--color-info-fg))",
    );
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
    const preset = (await import("../src/index.ts")).default;

    expect(preset.content).toEqual([]);
    assertTokens(preset);

    if (typeof preset === "function") {
      const result = preset();
      expect(result.content).toEqual([]);
      assertTokens(result);
    }
  });
});
