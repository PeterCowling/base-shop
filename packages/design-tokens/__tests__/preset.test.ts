import { jest } from "@jest/globals";

describe("design tokens preset", () => {
  it("exports preset configuration", async () => {
    jest.resetModules();
    const preset = (await import("../src/index.ts")).default;

    // ensure color tokens exist
    expect(preset.theme?.extend?.colors?.bg).toBe("hsl(var(--color-bg))");

    // if preset is a function, calling it should return same config
    if (typeof preset === "function") {
      const result = preset();
      expect(result.theme?.extend?.colors?.bg).toBe("hsl(var(--color-bg))");
    }
  });
});
