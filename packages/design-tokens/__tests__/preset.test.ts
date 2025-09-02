import { jest } from "@jest/globals";

describe("design tokens preset", () => {
  const assertTokens = (config: any) => {
    expect(config.theme?.extend?.colors?.bg).toBe("hsl(var(--color-bg))");
    expect(config.theme?.extend?.textColor?.["primary-foreground"]).toBe(
      "hsl(var(--color-primary-fg))",
    );
    expect(config.theme?.extend?.textColor?.["accent-foreground"]).toBe(
      "hsl(var(--color-accent-fg))",
    );
    expect(config.theme?.extend?.textColor?.["danger-foreground"]).toBe(
      "hsl(var(--color-danger-fg))",
    );
    expect(config.theme?.extend?.textColor?.["success-foreground"]).toBe(
      "hsl(var(--color-success-fg))",
    );
    expect(config.theme?.extend?.textColor?.["warning-foreground"]).toBe(
      "hsl(var(--color-warning-fg))",
    );
    expect(config.theme?.extend?.textColor?.["info-foreground"]).toBe(
      "hsl(var(--color-info-fg))",
    );
    expect(config.theme?.extend?.fontFamily?.sans).toBe("var(--font-sans)");
    expect(config.theme?.extend?.fontFamily?.mono).toBe("var(--font-mono)");
    expect(config.theme?.extend?.spacing?.["1"]).toBe("var(--space-1)");
    expect(config.theme?.extend?.spacing?.["2"]).toBe("var(--space-2)");
    expect(config.theme?.extend?.spacing?.["3"]).toBe("var(--space-3)");
    expect(config.theme?.extend?.spacing?.["4"]).toBe("var(--space-4)");
    expect(config.theme?.extend?.borderRadius?.sm).toBe("var(--radius-sm)");
    expect(config.theme?.extend?.borderRadius?.md).toBe("var(--radius-md)");
    expect(config.theme?.extend?.borderRadius?.lg).toBe("var(--radius-lg)");
    expect(config.theme?.extend?.boxShadow?.sm).toBe("var(--shadow-sm)");
    expect(config.theme?.extend?.boxShadow?.md).toBe("var(--shadow-md)");
    expect(config.theme?.extend?.boxShadow?.lg).toBe("var(--shadow-lg)");
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
