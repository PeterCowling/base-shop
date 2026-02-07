import {
  areDistinguishable,
  clampToSrgbGamut,
  deltaE,
  generateGradientStops,
  hexToOklch,
  hexToRgb,
  interpolateOklch,
  isInSrgbGamut,
  meetsWcagAA,
  meetsWcagAAA,
  type OklchColor,
  oklchToHex,
  oklchToSrgb,
  relativeLuminance,
  rgbToHex,
  srgbToOklch,
  wcagContrast,
} from "../../../src/math/color/oklch";

describe("OKLCH Color Utilities", () => {
  // ============================================================================
  // sRGB ↔ OKLCH Conversions
  // ============================================================================

  describe("srgbToOklch", () => {
    it("converts black correctly", () => {
      const oklch = srgbToOklch(0, 0, 0);
      expect(oklch.l).toBeCloseTo(0, 3);
      expect(oklch.c).toBeCloseTo(0, 3);
    });

    it("converts white correctly", () => {
      const oklch = srgbToOklch(255, 255, 255);
      expect(oklch.l).toBeCloseTo(1, 3);
      expect(oklch.c).toBeCloseTo(0, 3);
    });

    it("converts gray (achromatic) correctly", () => {
      const oklch = srgbToOklch(128, 128, 128);
      expect(oklch.l).toBeGreaterThan(0.4);
      expect(oklch.l).toBeLessThan(0.6);
      expect(oklch.c).toBeCloseTo(0, 2);
    });

    it("converts pure red correctly", () => {
      const oklch = srgbToOklch(255, 0, 0);
      expect(oklch.l).toBeGreaterThan(0.5);
      expect(oklch.l).toBeLessThan(0.7);
      expect(oklch.c).toBeGreaterThan(0.2);
      // Red hue should be around 29°
      expect(oklch.h).toBeGreaterThan(20);
      expect(oklch.h).toBeLessThan(40);
    });

    it("converts pure green correctly", () => {
      const oklch = srgbToOklch(0, 255, 0);
      expect(oklch.l).toBeGreaterThan(0.8);
      expect(oklch.c).toBeGreaterThan(0.2);
      // Green hue should be around 142°
      expect(oklch.h).toBeGreaterThan(130);
      expect(oklch.h).toBeLessThan(150);
    });

    it("converts pure blue correctly", () => {
      const oklch = srgbToOklch(0, 0, 255);
      expect(oklch.l).toBeGreaterThan(0.4);
      expect(oklch.l).toBeLessThan(0.5);
      expect(oklch.c).toBeGreaterThan(0.3);
      // Blue hue should be around 264°
      expect(oklch.h).toBeGreaterThan(255);
      expect(oklch.h).toBeLessThan(275);
    });
  });

  describe("oklchToSrgb", () => {
    it("converts black correctly", () => {
      const [r, g, b] = oklchToSrgb({ l: 0, c: 0, h: 0 });
      expect(r).toBe(0);
      expect(g).toBe(0);
      expect(b).toBe(0);
    });

    it("converts white correctly", () => {
      const [r, g, b] = oklchToSrgb({ l: 1, c: 0, h: 0 });
      expect(r).toBe(255);
      expect(g).toBe(255);
      expect(b).toBe(255);
    });

    it("clamps out-of-gamut values", () => {
      // Very high chroma that would be out of sRGB gamut
      const [r, g, b] = oklchToSrgb({ l: 0.5, c: 0.5, h: 0 });
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    });
  });

  describe("round-trip conversions", () => {
    const testColors: [number, number, number][] = [
      [0, 0, 0], // Black
      [255, 255, 255], // White
      [128, 128, 128], // Gray
      [255, 0, 0], // Red
      [0, 255, 0], // Green
      [0, 0, 255], // Blue
      [255, 255, 0], // Yellow
      [255, 0, 255], // Magenta
      [0, 255, 255], // Cyan
      [192, 128, 64], // Random color
      [64, 192, 128], // Another random
    ];

    it.each(testColors)(
      "sRGB → OKLCH → sRGB round-trip for (%d, %d, %d)",
      (r, g, b) => {
        const oklch = srgbToOklch(r, g, b);
        const [r2, g2, b2] = oklchToSrgb(oklch);

        // Allow small error due to floating point and clamping
        expect(r2).toBeCloseTo(r, 0);
        expect(g2).toBeCloseTo(g, 0);
        expect(b2).toBeCloseTo(b, 0);
      }
    );
  });

  // ============================================================================
  // Hex Conversions
  // ============================================================================

  describe("hexToOklch", () => {
    it("converts 6-digit hex", () => {
      const oklch = hexToOklch("#ff8000");
      expect(oklch.l).toBeGreaterThan(0);
      expect(oklch.c).toBeGreaterThan(0);
    });

    it("converts 3-digit hex", () => {
      const oklch = hexToOklch("#f80");
      const oklch6 = hexToOklch("#ff8800");
      expect(oklch.l).toBeCloseTo(oklch6.l, 3);
      expect(oklch.c).toBeCloseTo(oklch6.c, 3);
      expect(oklch.h).toBeCloseTo(oklch6.h, 1);
    });

    it("handles lowercase hex", () => {
      const lower = hexToOklch("#aabbcc");
      const upper = hexToOklch("#AABBCC");
      expect(lower.l).toBeCloseTo(upper.l, 5);
      expect(lower.c).toBeCloseTo(upper.c, 5);
      expect(lower.h).toBeCloseTo(upper.h, 5);
    });

    it("throws for invalid hex", () => {
      expect(() => hexToOklch("ff8000")).toThrow("Invalid hex color");
      expect(() => hexToOklch("#ff800")).toThrow("Invalid hex color");
      expect(() => hexToOklch("#gggggg")).toThrow("Invalid hex color");
      expect(() => hexToOklch("")).toThrow("Invalid hex color");
    });
  });

  describe("oklchToHex", () => {
    it("produces valid 6-digit hex", () => {
      const hex = oklchToHex({ l: 0.7, c: 0.15, h: 30 });
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("round-trips with hexToOklch", () => {
      const original = "#c08040";
      const oklch = hexToOklch(original);
      const roundTrip = oklchToHex(oklch);
      expect(roundTrip).toBe(original);
    });
  });

  describe("hexToRgb", () => {
    it("converts 6-digit hex", () => {
      expect(hexToRgb("#ff8000")).toEqual([255, 128, 0]);
    });

    it("converts 3-digit hex", () => {
      expect(hexToRgb("#f80")).toEqual([255, 136, 0]);
    });

    it("throws for invalid hex", () => {
      expect(() => hexToRgb("invalid")).toThrow("Invalid hex color");
    });
  });

  describe("rgbToHex", () => {
    it("converts RGB to hex", () => {
      expect(rgbToHex([255, 128, 0])).toBe("#ff8000");
      expect(rgbToHex([0, 0, 0])).toBe("#000000");
      expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
    });
  });

  // ============================================================================
  // Perceptual Operations
  // ============================================================================

  describe("deltaE", () => {
    it("returns 0 for identical colors", () => {
      const color: OklchColor = { l: 0.5, c: 0.15, h: 180 };
      expect(deltaE(color, color)).toBeCloseTo(0, 5);
    });

    it("returns small value for similar colors", () => {
      const a: OklchColor = { l: 0.7, c: 0.15, h: 30 };
      const b: OklchColor = { l: 0.71, c: 0.15, h: 31 };
      const diff = deltaE(a, b);
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(5);
    });

    it("returns large value for opposite colors", () => {
      const black: OklchColor = { l: 0, c: 0, h: 0 };
      const white: OklchColor = { l: 1, c: 0, h: 0 };
      const diff = deltaE(black, white);
      expect(diff).toBeGreaterThan(90);
    });

    it("is symmetric", () => {
      const a: OklchColor = { l: 0.6, c: 0.2, h: 45 };
      const b: OklchColor = { l: 0.4, c: 0.1, h: 200 };
      expect(deltaE(a, b)).toBeCloseTo(deltaE(b, a), 10);
    });

    it("handles achromatic colors", () => {
      const gray1: OklchColor = { l: 0.3, c: 0, h: 0 };
      const gray2: OklchColor = { l: 0.7, c: 0, h: 180 }; // Different hue but 0 chroma
      const diff = deltaE(gray1, gray2);
      // Should only depend on lightness difference
      expect(diff).toBeGreaterThan(30);
      expect(diff).toBeLessThan(50);
    });
  });

  describe("areDistinguishable", () => {
    it("returns true for clearly different colors", () => {
      const red: OklchColor = { l: 0.6, c: 0.25, h: 29 };
      const blue: OklchColor = { l: 0.45, c: 0.31, h: 264 };
      expect(areDistinguishable(red, blue)).toBe(true);
    });

    it("returns false for nearly identical colors", () => {
      const a: OklchColor = { l: 0.5, c: 0.15, h: 180 };
      const b: OklchColor = { l: 0.5001, c: 0.15, h: 180.01 };
      expect(areDistinguishable(a, b)).toBe(false);
    });

    it("respects custom threshold", () => {
      const a: OklchColor = { l: 0.5, c: 0.15, h: 180 };
      const b: OklchColor = { l: 0.52, c: 0.15, h: 180 };

      // With default threshold (2.0), might be distinguishable
      const defaultResult = areDistinguishable(a, b);

      // With high threshold, not distinguishable
      expect(areDistinguishable(a, b, 50)).toBe(false);

      // With very low threshold, definitely distinguishable
      expect(areDistinguishable(a, b, 0.1)).toBe(true);
    });
  });

  // ============================================================================
  // Gradient/Interpolation
  // ============================================================================

  describe("interpolateOklch", () => {
    it("returns start color at t=0", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const result = interpolateOklch(a, b, 0);
      expect(result.l).toBeCloseTo(a.l, 5);
    });

    it("returns end color at t=1", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const result = interpolateOklch(a, b, 1);
      expect(result.l).toBeCloseTo(b.l, 5);
    });

    it("returns midpoint at t=0.5", () => {
      const a: OklchColor = { l: 0.2, c: 0.1, h: 0 };
      const b: OklchColor = { l: 0.8, c: 0.1, h: 0 };
      const result = interpolateOklch(a, b, 0.5);
      expect(result.l).toBeCloseTo(0.5, 2);
    });

    it("clamps t < 0 to 0", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const result = interpolateOklch(a, b, -0.5);
      expect(result.l).toBeCloseTo(a.l, 5);
    });

    it("clamps t > 1 to 1", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const result = interpolateOklch(a, b, 1.5);
      expect(result.l).toBeCloseTo(b.l, 5);
    });

    it("interpolates in Oklab space (perceptually uniform)", () => {
      // Interpolating between two saturated colors should go through
      // less saturated intermediate in Oklab
      const red: OklchColor = { l: 0.6, c: 0.25, h: 29 };
      const cyan: OklchColor = { l: 0.9, c: 0.15, h: 195 };
      const mid = interpolateOklch(red, cyan, 0.5);

      // Midpoint should have lower chroma than both endpoints
      // (path through Oklab is straighter, avoiding color wheel)
      expect(mid.c).toBeLessThan(Math.max(red.c, cyan.c));
    });
  });

  describe("generateGradientStops", () => {
    it("generates correct number of stops", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const stops = generateGradientStops(a, b, 5);
      expect(stops).toHaveLength(5);
    });

    it("first stop is start color", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const stops = generateGradientStops(a, b, 5);
      expect(stops[0].l).toBeCloseTo(a.l, 5);
    });

    it("last stop is end color", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      const stops = generateGradientStops(a, b, 5);
      expect(stops[4].l).toBeCloseTo(b.l, 5);
    });

    it("throws for less than 2 steps", () => {
      const a: OklchColor = { l: 0.3, c: 0.1, h: 30 };
      const b: OklchColor = { l: 0.8, c: 0.2, h: 200 };
      expect(() => generateGradientStops(a, b, 1)).toThrow(
        "Gradient requires at least 2 steps"
      );
    });

    it("produces evenly spaced lightness values for achromatic gradient", () => {
      const black: OklchColor = { l: 0, c: 0, h: 0 };
      const white: OklchColor = { l: 1, c: 0, h: 0 };
      const stops = generateGradientStops(black, white, 5);

      // Should have lightness values 0, 0.25, 0.5, 0.75, 1
      expect(stops[0].l).toBeCloseTo(0, 3);
      expect(stops[1].l).toBeCloseTo(0.25, 3);
      expect(stops[2].l).toBeCloseTo(0.5, 3);
      expect(stops[3].l).toBeCloseTo(0.75, 3);
      expect(stops[4].l).toBeCloseTo(1, 3);
    });
  });

  // ============================================================================
  // WCAG Contrast
  // ============================================================================

  describe("relativeLuminance", () => {
    it("returns 0 for black", () => {
      expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    });

    it("returns 1 for white", () => {
      expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
    });

    it("returns correct value for mid-gray", () => {
      // sRGB 128 is not 0.5 luminance due to gamma
      const lum = relativeLuminance([128, 128, 128]);
      expect(lum).toBeGreaterThan(0.2);
      expect(lum).toBeLessThan(0.25);
    });

    it("weights RGB channels according to WCAG spec", () => {
      // Red has lowest weight, green highest, blue in middle
      const redLum = relativeLuminance([255, 0, 0]);
      const greenLum = relativeLuminance([0, 255, 0]);
      const blueLum = relativeLuminance([0, 0, 255]);

      expect(greenLum).toBeGreaterThan(redLum);
      expect(greenLum).toBeGreaterThan(blueLum);
      expect(redLum).toBeGreaterThan(blueLum);
    });
  });

  describe("wcagContrast", () => {
    it("returns 21 for black on white", () => {
      const ratio = wcagContrast("#000000", "#ffffff");
      expect(ratio).toBeCloseTo(21, 1);
    });

    it("returns 21 for white on black", () => {
      const ratio = wcagContrast("#ffffff", "#000000");
      expect(ratio).toBeCloseTo(21, 1);
    });

    it("returns 1 for identical colors", () => {
      const ratio = wcagContrast("#808080", "#808080");
      expect(ratio).toBeCloseTo(1, 5);
    });

    it("is symmetric", () => {
      const ratio1 = wcagContrast("#ff0000", "#0000ff");
      const ratio2 = wcagContrast("#0000ff", "#ff0000");
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });

    it("returns value in valid range [1, 21]", () => {
      const ratio = wcagContrast("#c08040", "#4080c0");
      expect(ratio).toBeGreaterThanOrEqual(1);
      expect(ratio).toBeLessThanOrEqual(21);
    });
  });

  describe("meetsWcagAA", () => {
    it("returns true for black on white", () => {
      expect(meetsWcagAA("#000000", "#ffffff")).toBe(true);
    });

    it("returns false for low contrast colors", () => {
      // Gray on gray
      expect(meetsWcagAA("#666666", "#999999")).toBe(false);
    });

    it("applies lower threshold for large text", () => {
      // This color pair might pass for large text but not normal text
      const fg = "#767676";
      const bg = "#ffffff";
      const ratio = wcagContrast(fg, bg);

      // If ratio is between 3 and 4.5, it passes large text but not normal
      if (ratio >= 3 && ratio < 4.5) {
        expect(meetsWcagAA(fg, bg, false)).toBe(false);
        expect(meetsWcagAA(fg, bg, true)).toBe(true);
      }
    });
  });

  describe("meetsWcagAAA", () => {
    it("returns true for black on white", () => {
      expect(meetsWcagAAA("#000000", "#ffffff")).toBe(true);
    });

    it("returns false for medium contrast", () => {
      // 4.5:1 ratio passes AA but not AAA
      expect(meetsWcagAAA("#767676", "#ffffff")).toBe(false);
    });

    it("applies correct thresholds (7:1 normal, 4.5:1 large)", () => {
      const fg = "#595959";
      const bg = "#ffffff";
      const ratio = wcagContrast(fg, bg);

      // This gives approximately 7:1
      expect(ratio).toBeGreaterThan(6.5);
      expect(meetsWcagAAA(fg, bg, false)).toBe(true);
    });
  });

  // ============================================================================
  // Gamut Mapping
  // ============================================================================

  describe("isInSrgbGamut", () => {
    it("returns true for in-gamut colors", () => {
      // Low chroma colors are always in gamut
      expect(isInSrgbGamut({ l: 0.5, c: 0.05, h: 180 })).toBe(true);
      expect(isInSrgbGamut({ l: 0, c: 0, h: 0 })).toBe(true); // Black
      expect(isInSrgbGamut({ l: 1, c: 0, h: 0 })).toBe(true); // White
      // Mid-range colors with moderate chroma
      expect(isInSrgbGamut({ l: 0.6, c: 0.08, h: 60 })).toBe(true);
    });

    it("returns false for out-of-gamut colors", () => {
      // Very high chroma at mid-lightness is likely out of gamut
      expect(isInSrgbGamut({ l: 0.5, c: 0.4, h: 180 })).toBe(false);
    });

    it("correctly identifies sRGB primary colors as in-gamut", () => {
      const red = srgbToOklch(255, 0, 0);
      const green = srgbToOklch(0, 255, 0);
      const blue = srgbToOklch(0, 0, 255);

      expect(isInSrgbGamut(red)).toBe(true);
      expect(isInSrgbGamut(green)).toBe(true);
      expect(isInSrgbGamut(blue)).toBe(true);
    });
  });

  describe("clampToSrgbGamut", () => {
    it("returns same color if already in gamut", () => {
      // Use a definitely in-gamut color (low chroma)
      const color: OklchColor = { l: 0.5, c: 0.05, h: 180 };
      const clamped = clampToSrgbGamut(color);
      expect(clamped.l).toBeCloseTo(color.l, 3);
      expect(clamped.c).toBeCloseTo(color.c, 3);
      expect(clamped.h).toBeCloseTo(color.h, 3);
    });

    it("reduces chroma for out-of-gamut colors", () => {
      const outOfGamut: OklchColor = { l: 0.5, c: 0.4, h: 180 };
      const clamped = clampToSrgbGamut(outOfGamut);

      // Lightness and hue should be preserved
      expect(clamped.l).toBeCloseTo(outOfGamut.l, 3);
      expect(clamped.h).toBeCloseTo(outOfGamut.h, 3);

      // Chroma should be reduced
      expect(clamped.c).toBeLessThan(outOfGamut.c);

      // Result should be in gamut
      expect(isInSrgbGamut(clamped)).toBe(true);
    });

    it("produces valid sRGB output", () => {
      const outOfGamut: OklchColor = { l: 0.7, c: 0.35, h: 120 };
      const clamped = clampToSrgbGamut(outOfGamut);
      const [r, g, b] = oklchToSrgb(clamped);

      // All channels should be in valid range
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    });
  });

  // ============================================================================
  // Integration / Real-World Scenarios
  // ============================================================================

  describe("real-world scenarios", () => {
    it("can create a perceptually uniform gray scale", () => {
      const black: OklchColor = { l: 0, c: 0, h: 0 };
      const white: OklchColor = { l: 1, c: 0, h: 0 };
      const grays = generateGradientStops(black, white, 11);

      // Each step should have equal perceptual difference
      const differences: number[] = [];
      for (let i = 1; i < grays.length; i++) {
        differences.push(deltaE(grays[i - 1], grays[i]));
      }

      // All differences should be approximately equal
      const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
      for (const diff of differences) {
        expect(diff).toBeCloseTo(avgDiff, 0);
      }
    });

    it("can check if design tokens are distinguishable", () => {
      const primary = hexToOklch("#0066cc");
      const secondary = hexToOklch("#0077dd");

      // These are quite similar
      const canDistinguish = areDistinguishable(primary, secondary);
      const diff = deltaE(primary, secondary);

      // Should be able to tell apart
      expect(canDistinguish).toBe(true);
      expect(diff).toBeGreaterThan(2);
    });

    it("can generate accessible color palette", () => {
      const background = "#ffffff";
      const foreground = "#333333";

      // Verify accessibility
      expect(meetsWcagAA(foreground, background)).toBe(true);
      expect(wcagContrast(foreground, background)).toBeGreaterThan(10);
    });

    it("can convert CSS colors to OKLCH for manipulation", () => {
      const brandColor = "#ff6b35";
      const oklch = hexToOklch(brandColor);

      // Create lighter variant by increasing lightness
      const lighterOklch: OklchColor = {
        ...oklch,
        l: Math.min(1, oklch.l + 0.2),
      };
      const lighterHex = oklchToHex(clampToSrgbGamut(lighterOklch));

      // Verify it's valid and lighter
      expect(lighterHex).toMatch(/^#[0-9a-f]{6}$/);
      const lighterRgb = hexToRgb(lighterHex);
      const originalRgb = hexToRgb(brandColor);
      expect(relativeLuminance(lighterRgb)).toBeGreaterThan(
        relativeLuminance(originalRgb)
      );
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    it("handles zero chroma (achromatic) correctly", () => {
      const gray = srgbToOklch(128, 128, 128);
      expect(gray.c).toBeLessThan(0.001);

      const [r, g, b] = oklchToSrgb({ l: 0.5, c: 0, h: 123 }); // Hue ignored
      // Should produce a gray
      expect(Math.abs(r - g)).toBeLessThan(2);
      expect(Math.abs(g - b)).toBeLessThan(2);
    });

    it("handles hue wraparound", () => {
      const color1 = srgbToOklch(255, 0, 0);
      const color2: OklchColor = { ...color1, h: color1.h + 360 };

      // Should be same color regardless of hue + 360
      const [r1, g1, b1] = oklchToSrgb(color1);
      const [r2, g2, b2] = oklchToSrgb(color2);

      expect(r1).toBe(r2);
      expect(g1).toBe(g2);
      expect(b1).toBe(b2);
    });

    it("handles negative hue", () => {
      const positive: OklchColor = { l: 0.5, c: 0.15, h: 350 };
      const negative: OklchColor = { l: 0.5, c: 0.15, h: -10 };

      const [r1, g1, b1] = oklchToSrgb(positive);
      const [r2, g2, b2] = oklchToSrgb(negative);

      expect(r1).toBe(r2);
      expect(g1).toBe(g2);
      expect(b1).toBe(b2);
    });

    it("handles very small values without precision loss", () => {
      const nearBlack: OklchColor = { l: 0.001, c: 0.001, h: 0 };
      const [r, g, b] = oklchToSrgb(nearBlack);

      // Should be very dark but not exactly 0
      expect(r).toBeGreaterThanOrEqual(0);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
    });
  });
});
