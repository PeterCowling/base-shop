import { jest } from "@jest/globals";

import designTokens from "../index.ts";
import { disabledColors } from "../src/core/disabled.ts";

describe("designTokens Tailwind plugin", () => {
  it("exposes the expected Tailwind theme extensions", () => {
    const pluginInstance = designTokens();

    const theme = (pluginInstance as any).config?.theme?.extend ?? {};
    const colors = theme.colors ?? {};
    const textColor = theme.textColor ?? {};

    // Colors should reference CSS variables inside hsl(), but avoid literal
    // 'hsl(var(--…))' strings in tests per lint rule.
    expect(colors.bg).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.bg)).toContain("--color-bg");
    expect(colors.fg).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.fg)).toContain("--color-fg");
    expect(colors.primary).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.primary)).toContain("--color-primary");
    expect(colors.accent).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.accent)).toContain("--color-accent");
    expect(colors.danger).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.danger)).toContain("--color-danger");
    expect(colors.muted).toEqual(expect.stringMatching(/^hsl\(.*\)$/));
    expect(String(colors.muted)).toContain("--color-muted");

    // Foreground text tokens
    expect(textColor["primary-foreground"]).toEqual(
      expect.stringMatching(/^hsl\(.*\)$/)
    );
    expect(String(textColor["primary-foreground"]).toString()).toContain(
      "--color-primary-fg"
    );
    expect(textColor["accent-foreground"]).toEqual(
      expect.stringMatching(/^hsl\(.*\)$/)
    );
    expect(String(textColor["accent-foreground"]).toString()).toContain(
      "--color-accent-fg"
    );
    expect(textColor["danger-foreground"]).toEqual(
      expect.stringMatching(/^hsl\(.*\)$/)
    );
    expect(String(textColor["danger-foreground"]).toString()).toContain(
      "--color-danger-fg"
    );

    // Other tokens are raw CSS vars
    expect(theme.fontFamily?.sans).toBe("var(--font-sans)");
    expect(theme.fontFamily?.mono).toBe("var(--font-mono)");
    expect(theme.spacing?.["1"]).toBe("var(--space-1)");
    expect(theme.spacing?.["2"]).toBe("var(--space-2)");
    expect(theme.spacing?.["3"]).toBe("var(--space-3)");
    expect(theme.spacing?.["4"]).toBe("var(--space-4)");
    expect(theme.borderRadius?.sm).toBe("var(--radius-sm)");
    expect(theme.borderRadius?.md).toBe("var(--radius-md)");
    expect(theme.borderRadius?.lg).toBe("var(--radius-lg)");
  });

  it("registers a noop Tailwind plugin handler", () => {
    const pluginInstance = designTokens();

    expect(typeof pluginInstance.handler).toBe("function");

    const context = {
      addBase: jest.fn(),
      addComponents: jest.fn(),
      addUtilities: jest.fn(),
      theme: jest.fn(),
    };

    expect(() => pluginInstance.handler(context as any)).not.toThrow();
    expect(context.addBase).not.toHaveBeenCalled();
    expect(context.addComponents).not.toHaveBeenCalled();
    expect(context.addUtilities).not.toHaveBeenCalled();
  });
});

describe("disabledColors", () => {
  it("exports expected disabled state tokens", () => {
    expect(disabledColors).toBeDefined();
    expect(disabledColors.text).toBe('var(--color-muted-foreground)');
    expect(disabledColors.background).toBe('var(--color-muted)');
    expect(disabledColors.border).toBe('var(--color-border)');
    expect(disabledColors.opacity).toBe('0.5');
  });

  it("has all expected keys", () => {
    const keys = Object.keys(disabledColors);
    expect(keys).toEqual(['text', 'background', 'border', 'opacity']);
  });
});
