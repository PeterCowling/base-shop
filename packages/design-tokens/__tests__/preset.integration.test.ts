import { describe, expect, it } from "@jest/globals";

let resolveConfig: any;
try {
  // tailwindcss is not a direct dep of this package; skip if unavailable
  resolveConfig = require("tailwindcss/resolveConfig");
} catch {
  console.warn("tailwindcss/resolveConfig not found, skipping integration test");
}

const itFn = resolveConfig ? it : it.skip;

describe("design tokens preset integration", () => {
  itFn("resolves preset with tailwind", async () => {
    const preset = (await import("../src/index.ts")).default;
    const config = resolveConfig({ presets: [preset], content: [] });

    expect(config.theme?.colors?.bg).toBe("hsl(var(--color-bg))");
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
  });
});

