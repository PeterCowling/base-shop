/**
 * Tests for the color palette generator.
 */

import {
  hexToRgb,
  hexToHsl,
  rgbToHsl,
  hslToRgb,
  hslToHex,
  hslToCssValue,
  relativeLuminance,
  contrastRatio,
  generatePalette,
  validateAccessibility,
  generateAccentColor,
  generateSecondaryColor,
  HSLColor,
  RGBColor,
} from '../../src/generate-theme/palette';

describe('Color Conversions', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      expect(hexToRgb('#336699')).toEqual({ r: 51, g: 102, b: 153 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert 3-digit hex to RGB', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#369')).toEqual({ r: 51, g: 102, b: 153 });
    });

    it('should handle hex without # prefix', () => {
      expect(hexToRgb('336699')).toEqual({ r: 51, g: 102, b: 153 });
    });

    it('should throw on invalid hex', () => {
      expect(() => hexToRgb('#gg0000')).toThrow('Invalid hex color');
      expect(() => hexToRgb('#12345')).toThrow('Invalid hex color');
    });
  });

  describe('rgbToHsl', () => {
    it('should convert white correctly', () => {
      const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(100);
    });

    it('should convert black correctly', () => {
      const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(0);
      expect(hsl.l).toBe(0);
    });

    it('should convert pure red correctly', () => {
      const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });

    it('should convert blue correctly', () => {
      const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });
  });

  describe('hslToRgb', () => {
    it('should convert white correctly', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert black correctly', () => {
      expect(hslToRgb({ h: 0, s: 0, l: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert pure red correctly', () => {
      const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });

  describe('round-trip conversions', () => {
    it('should preserve color through hex -> rgb -> hsl -> rgb -> hex', () => {
      const testColors = ['#336699', '#ff5500', '#00ff00', '#808080'];
      for (const color of testColors) {
        const rgb1 = hexToRgb(color);
        const hsl = rgbToHsl(rgb1);
        const rgb2 = hslToRgb(hsl);
        const hex2 = hslToHex(hsl);
        // Allow for small rounding differences
        expect(Math.abs(rgb1.r - rgb2.r)).toBeLessThanOrEqual(1);
        expect(Math.abs(rgb1.g - rgb2.g)).toBeLessThanOrEqual(1);
        expect(Math.abs(rgb1.b - rgb2.b)).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('hslToCssValue', () => {
    it('should format HSL as CSS value', () => {
      expect(hslToCssValue({ h: 220, s: 90, l: 56 })).toBe('220 90% 56%');
      expect(hslToCssValue({ h: 0, s: 0, l: 100 })).toBe('0 0% 100%');
    });
  });
});

describe('Contrast Calculations', () => {
  describe('relativeLuminance', () => {
    it('should return 1 for white', () => {
      const lum = relativeLuminance({ r: 255, g: 255, b: 255 });
      expect(lum).toBeCloseTo(1, 5);
    });

    it('should return 0 for black', () => {
      const lum = relativeLuminance({ r: 0, g: 0, b: 0 });
      expect(lum).toBeCloseTo(0, 5);
    });
  });

  describe('contrastRatio', () => {
    it('should return 21 for black on white', () => {
      const white: RGBColor = { r: 255, g: 255, b: 255 };
      const black: RGBColor = { r: 0, g: 0, b: 0 };
      const ratio = contrastRatio(white, black);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1 for same colors', () => {
      const color: RGBColor = { r: 128, g: 128, b: 128 };
      const ratio = contrastRatio(color, color);
      expect(ratio).toBeCloseTo(1, 5);
    });

    it('should be symmetric', () => {
      const color1: RGBColor = { r: 51, g: 102, b: 153 };
      const color2: RGBColor = { r: 255, g: 255, b: 255 };
      expect(contrastRatio(color1, color2)).toBeCloseTo(contrastRatio(color2, color1), 5);
    });
  });
});

describe('Palette Generation', () => {
  describe('generatePalette', () => {
    it('should generate 11 shades', () => {
      const palette = generatePalette('#336699');
      expect(palette.shades).toHaveLength(11);
    });

    it('should have expected shade values', () => {
      const palette = generatePalette('#336699');
      const shadeValues = palette.shades.map((s) => s.shade);
      expect(shadeValues).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
    });

    it('should preserve hue across shades', () => {
      const palette = generatePalette('#336699');
      const hues = palette.shades.map((s) => s.hsl.h);
      // All hues should be close to the primary hue
      const primaryHue = palette.primary.h;
      for (const hue of hues) {
        expect(Math.abs(hue - primaryHue)).toBeLessThanOrEqual(1);
      }
    });

    it('should have generally decreasing lightness from shade 50 to 950', () => {
      const palette = generatePalette('#336699');
      // Shade 50 should be lightest, 950 should be darkest
      const shade50 = palette.shades.find((s) => s.shade === 50)!;
      const shade950 = palette.shades.find((s) => s.shade === 950)!;
      expect(shade50.hsl.l).toBeGreaterThan(shade950.hsl.l);
      // Lightness should generally decrease (allow for brand shade adjustment)
      expect(shade50.hsl.l).toBeGreaterThan(90);
      expect(shade950.hsl.l).toBeLessThan(15);
    });

    it('should include contrast ratios', () => {
      const palette = generatePalette('#336699');
      for (const shade of palette.shades) {
        expect(shade.contrastOnWhite).toBeGreaterThan(0);
        expect(shade.contrastOnBlack).toBeGreaterThan(0);
      }
    });

    it('should mark AA compliance correctly', () => {
      const palette = generatePalette('#336699');
      for (const shade of palette.shades) {
        if (shade.contrastOnWhite >= 4.5) {
          expect(shade.aaOnWhite).toBe(true);
        } else {
          expect(shade.aaOnWhite).toBe(false);
        }
      }
    });

    it('should recommend appropriate text shades', () => {
      const palette = generatePalette('#336699');
      // Text on white should be a darker shade
      expect(palette.textOnWhite).toBeGreaterThanOrEqual(600);
      // Text on black should be a lighter shade
      expect(palette.textOnBlack).toBeLessThanOrEqual(400);
    });
  });

  describe('validateAccessibility', () => {
    it('should pass for a good palette', () => {
      const palette = generatePalette('#336699');
      const result = validateAccessibility(palette);
      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should provide suggestions even for valid palettes', () => {
      // A very light color may have suggestions
      const palette = generatePalette('#cccccc');
      const result = validateAccessibility(palette);
      // May or may not have suggestions, but shouldn't crash
      expect(Array.isArray(result.suggestions)).toBe(true);
    });
  });

  describe('generateAccentColor', () => {
    it('should offset hue by default amount', () => {
      const primary: HSLColor = { h: 220, s: 90, l: 50 };
      const accent = generateAccentColor(primary);
      expect(accent.h).toBe((220 + 40) % 360);
    });

    it('should allow custom offset', () => {
      const primary: HSLColor = { h: 220, s: 90, l: 50 };
      const accent = generateAccentColor(primary, 180);
      expect(accent.h).toBe((220 + 180) % 360);
    });

    it('should wrap hue around 360', () => {
      const primary: HSLColor = { h: 340, s: 90, l: 50 };
      const accent = generateAccentColor(primary, 40);
      expect(accent.h).toBe(20);
    });
  });

  describe('generateSecondaryColor', () => {
    it('should generate complementary color', () => {
      const primary: HSLColor = { h: 220, s: 90, l: 50 };
      const secondary = generateSecondaryColor(primary);
      expect(secondary.h).toBe((220 + 180) % 360);
    });

    it('should be more muted than primary', () => {
      const primary: HSLColor = { h: 220, s: 90, l: 50 };
      const secondary = generateSecondaryColor(primary);
      expect(secondary.s).toBeLessThan(primary.s);
    });
  });
});

describe('Edge Cases', () => {
  it('should handle pure white input', () => {
    const palette = generatePalette('#ffffff');
    expect(palette.shades).toHaveLength(11);
    // White has no hue, so all shades should be grayscale
    expect(palette.primary.s).toBe(0);
  });

  it('should handle pure black input', () => {
    const palette = generatePalette('#000000');
    expect(palette.shades).toHaveLength(11);
  });

  it('should handle very saturated colors', () => {
    const palette = generatePalette('#ff0000');
    expect(palette.shades).toHaveLength(11);
    expect(palette.primary.h).toBe(0);
  });

  it('should handle very dark colors', () => {
    const palette = generatePalette('#0a0a0a');
    expect(palette.shades).toHaveLength(11);
  });

  it('should handle very light colors', () => {
    const palette = generatePalette('#fafafa');
    expect(palette.shades).toHaveLength(11);
  });
});
