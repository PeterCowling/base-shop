import { getContrast } from "../../../cms/ColorInput";

describe("FontsPanel surface/text contrast", () => {
  beforeEach(() => {
    // Light mode defaults
    document.documentElement.style.setProperty("--color-bg", "0 0% 100%");
    document.documentElement.style.setProperty("--color-fg", "0 0% 10%");
    document.documentElement.style.setProperty("--color-muted-fg", "0 0% 20%");
    // Explicitly set surface token to avoid var() fallback in test env
    document.documentElement.style.setProperty("--surface-3", "0 0% 100%");
  });

  it("meets WCAG AA contrast on light surfaces", () => {
    const ratio = getContrast("hsl(var(--color-fg))", "hsl(var(--surface-3))");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("meets WCAG AA contrast on dark surfaces", () => {
    document.documentElement.style.setProperty("--color-bg", "0 0% 4%");
    document.documentElement.style.setProperty("--color-fg", "0 0% 93%");
    document.documentElement.style.setProperty("--color-muted-fg", "0 0% 72%");
    document.documentElement.style.setProperty("--surface-3", "0 0% 4%");
    const ratio = getContrast("hsl(var(--color-fg))", "hsl(var(--surface-3))");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("ensures muted foreground meets AA on light surfaces", () => {
    // Light surface-3 and muted text should still be >= 4.5
    document.documentElement.style.setProperty("--surface-3", "0 0% 96%");
    const ratio = getContrast("hsl(var(--color-muted-fg))", "hsl(var(--surface-3))");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("ensures muted foreground meets AA on dark surfaces", () => {
    // Dark theme values
    document.documentElement.style.setProperty("--surface-3", "222 12% 16%");
    document.documentElement.style.setProperty("--color-muted-fg", "0 0% 86%");
    const ratio = getContrast("hsl(var(--color-muted-fg))", "hsl(var(--surface-3))");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  describe("links and interactive states", () => {
    it("link text meets AA on light and dark surfaces", () => {
      // Light mode link vs surface-3
      document.documentElement.style.setProperty("--surface-3", "0 0% 96%");
      document.documentElement.style.setProperty("--color-link", "220 75% 40%");
      expect(getContrast("hsl(var(--color-link))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(4.5);

      // Dark mode link vs surface-3
      document.documentElement.style.setProperty("--surface-3", "222 12% 16%");
      document.documentElement.style.setProperty("--color-link", "220 80% 70%");
      expect(getContrast("hsl(var(--color-link))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(4.5);
    });

    it("button borders meet non-text contrast (>=3:1) on light and dark surfaces", () => {
      // Explicit resolved border tokens
      // Light
      document.documentElement.style.setProperty("--surface-3", "0 0% 96%");
      document.documentElement.style.setProperty("--border-2", "0 0% 10% / 0.22");
      expect(getContrast("hsl(var(--border-2))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(3);

      // Dark
      document.documentElement.style.setProperty("--surface-3", "222 12% 16%");
      document.documentElement.style.setProperty("--border-2", "0 0% 93% / 0.22");
      expect(getContrast("hsl(var(--border-2))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(3);
    });

    it("focus ring meets non-text contrast (>=3:1) on light and dark surfaces", () => {
      // Light
      document.documentElement.style.setProperty("--surface-3", "0 0% 96%");
      document.documentElement.style.setProperty("--ring", "220 90% 56%");
      expect(getContrast("hsl(var(--ring))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(3);

      // Dark
      document.documentElement.style.setProperty("--surface-3", "222 12% 16%");
      document.documentElement.style.setProperty("--ring", "221 75% 62%");
      expect(getContrast("hsl(var(--ring))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(3);
    });
  });

  describe("'Use pairing' button", () => {
    it("button text meets AA on light and dark surfaces", () => {
      // Light: text vs raised button background (inherits surface-3)
      document.documentElement.style.setProperty("--surface-3", "0 0% 96%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 10%");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(4.5);

      // Dark
      document.documentElement.style.setProperty("--surface-3", "222 12% 16%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 93%");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-3))")).toBeGreaterThanOrEqual(4.5);
    });

    it("hovered button (surface-2) maintains text AA and border 3:1 in light and dark", () => {
      // Light hover: promote to surface-2
      document.documentElement.style.setProperty("--surface-2", "0 0% 94%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 10%");
      document.documentElement.style.setProperty("--border-2", "0 0% 10% / 0.22");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-2))")).toBeGreaterThanOrEqual(4.5);
      expect(getContrast("hsl(var(--border-2))", "hsl(var(--surface-2))")).toBeGreaterThanOrEqual(3);

      // Dark hover: promote to surface-2
      document.documentElement.style.setProperty("--surface-2", "222 14% 13%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 93%");
      document.documentElement.style.setProperty("--border-2", "0 0% 93% / 0.22");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-2))")).toBeGreaterThanOrEqual(4.5);
      expect(getContrast("hsl(var(--border-2))", "hsl(var(--surface-2))")).toBeGreaterThanOrEqual(3);
    });
  });

  describe("form controls (inputs/selects)", () => {
    it("input/select text meets AA on light and dark input surfaces", () => {
      // Light theme tokens
      document.documentElement.style.setProperty("--surface-input", "0 0% 96%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 10%");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-input))")).toBeGreaterThanOrEqual(4.5);

      // Dark theme tokens
      document.documentElement.style.setProperty("--surface-input", "222 12% 18%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 93%");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-input))")).toBeGreaterThanOrEqual(4.5);
    });

    it("placeholder text remains readable on light and dark input surfaces", () => {
      // Light: 70% alpha of foreground against input surface
      document.documentElement.style.setProperty("--surface-input", "0 0% 96%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 10% / 0.70");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-input))")).toBeGreaterThanOrEqual(4.5);

      // Dark
      document.documentElement.style.setProperty("--surface-input", "222 12% 18%");
      document.documentElement.style.setProperty("--color-fg", "0 0% 93% / 0.70");
      expect(getContrast("hsl(var(--color-fg))", "hsl(var(--surface-input))")).toBeGreaterThanOrEqual(4.5);

      // Reset color-fg to opaque for subsequent tests
      document.documentElement.style.setProperty("--color-fg", "0 0% 93%");
    });
  });
});
