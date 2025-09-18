import { jest } from "@jest/globals";
import designTokens from "../index.ts";

describe("designTokens Tailwind plugin", () => {
  it("exposes the expected Tailwind theme extensions", () => {
    const pluginInstance = designTokens();

    expect(pluginInstance.config).toMatchObject({
      theme: {
        extend: {
          colors: {
            bg: "hsl(var(--color-bg))",
            fg: "hsl(var(--color-fg))",
            primary: "hsl(var(--color-primary))",
            accent: "hsl(var(--color-accent))",
            danger: "hsl(var(--color-danger))",
            muted: "hsl(var(--color-muted))",
          },
          textColor: {
            "primary-foreground": "hsl(var(--color-primary-fg))",
            "accent-foreground": "hsl(var(--color-accent-fg))",
            "danger-foreground": "hsl(var(--color-danger-fg))",
          },
          fontFamily: {
            sans: "var(--font-sans)",
            mono: "var(--font-mono)",
          },
          spacing: {
            1: "var(--space-1)",
            2: "var(--space-2)",
            3: "var(--space-3)",
            4: "var(--space-4)",
          },
          borderRadius: {
            sm: "var(--radius-sm)",
            md: "var(--radius-md)",
            lg: "var(--radius-lg)",
          },
        },
      },
    });
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
