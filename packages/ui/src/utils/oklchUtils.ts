/**
 * OKLCH Color Utilities for Design Systems
 *
 * Re-exports core OKLCH functions from @acme/lib and adds UI-specific helpers
 * for palette generation and accessibility validation.
 *
 * OKLCH is a perceptually uniform color space ideal for:
 * - Generating visually smooth gradients
 * - Creating color palettes with consistent visual spacing
 * - Checking if colors are perceptually distinguishable
 *
 * **Important**: WCAG luminance-based contrast remains the accessibility gate.
 * Use `validateColorPair` for accessibility compliance checking.
 */

// Re-export core OKLCH functions from @acme/lib
// Note: hexToRgb/rgbToHex are not re-exported here to avoid collision with colorUtils
import {
  clampToSrgbGamut,
  hexToOklch,
  meetsWcagAA,
  meetsWcagAAA,
  type OklchColor,
  oklchToHex,
  wcagContrast,
} from "@acme/lib";

export {
  areDistinguishable,
  clampToSrgbGamut,
  // Perceptual operations
  deltaE,
  generateGradientStops,
  // Core conversions
  hexToOklch,
  // Gradient/interpolation
  interpolateOklch,
  // Gamut mapping
  isInSrgbGamut,
  meetsWcagAA,
  meetsWcagAAA,
  // Types
  type OklchColor,
  oklchToHex,
  oklchToSrgb,
  // WCAG contrast (accessibility)
  relativeLuminance,
  type RgbTuple,
  srgbToOklch,
  wcagContrast,
} from "@acme/lib";

// ============================================================================
// Palette Generation
// ============================================================================

/**
 * Options for palette generation
 */
export interface PaletteOptions {
  /** Whether to clamp out-of-gamut colors (default: true) */
  clampGamut?: boolean;
  /** Lightness range [min, max] (default: [0.2, 0.95]) */
  lightnessRange?: [number, number];
}

const DEFAULT_PALETTE_OPTIONS: Required<PaletteOptions> = {
  clampGamut: true,
  lightnessRange: [0.2, 0.95],
};

/**
 * Generate a monochromatic palette from a base color
 *
 * Creates evenly-spaced lightness variations while preserving hue and chroma.
 * Useful for generating semantic color scales (e.g., primary-100 to primary-900).
 *
 * @param baseColor - Base hex color
 * @param steps - Number of palette steps to generate
 * @param options - Palette generation options
 * @returns Array of hex color strings from light to dark
 *
 * @example
 * ```typescript
 * const palette = generatePalette("#3b82f6", 9);
 * // Returns 9 shades from light blue to dark blue
 * // ["#e0f2fe", "#bae6fd", ..., "#1e3a5f"]
 * ```
 */
export function generatePalette(
  baseColor: string,
  steps: number,
  options?: PaletteOptions
): string[] {
  if (steps < 2) {
    throw new Error("Palette requires at least 2 steps");
  }

  const { clampGamut, lightnessRange } = { ...DEFAULT_PALETTE_OPTIONS, ...options };
  const [minL, maxL] = lightnessRange;

  const oklch = hexToOklch(baseColor);
  const result: string[] = [];

  for (let i = 0; i < steps; i++) {
    // Map step index to lightness range (reversed: 0 = lightest, steps-1 = darkest)
    const t = i / (steps - 1);
    const lightness = maxL - t * (maxL - minL);

    let color: OklchColor = {
      l: lightness,
      c: oklch.c,
      h: oklch.h,
    };

    // Reduce chroma at extreme lightness values to stay in gamut
    // Very light colors can't maintain high chroma
    if (lightness > 0.9) {
      color.c = oklch.c * ((1 - lightness) / 0.1);
    } else if (lightness < 0.3) {
      color.c = oklch.c * (lightness / 0.3);
    }

    if (clampGamut) {
      color = clampToSrgbGamut(color);
    }

    result.push(oklchToHex(color));
  }

  return result;
}

/**
 * Generate a complementary color palette
 *
 * Creates colors at specified hue offsets from the base color.
 * Useful for generating harmonious color schemes.
 *
 * @param baseColor - Base hex color
 * @param hueOffsets - Array of hue offsets in degrees (e.g., [180] for complementary)
 * @returns Array of hex colors [base, ...offsets]
 *
 * @example
 * ```typescript
 * // Complementary (opposite on color wheel)
 * generateHarmony("#3b82f6", [180]);
 *
 * // Triadic (evenly spaced)
 * generateHarmony("#3b82f6", [120, 240]);
 *
 * // Split-complementary
 * generateHarmony("#3b82f6", [150, 210]);
 * ```
 */
export function generateHarmony(
  baseColor: string,
  hueOffsets: number[]
): string[] {
  const oklch = hexToOklch(baseColor);
  const result: string[] = [baseColor];

  for (const offset of hueOffsets) {
    const newHue = (oklch.h + offset) % 360;
    const color = clampToSrgbGamut({
      l: oklch.l,
      c: oklch.c,
      h: newHue < 0 ? newHue + 360 : newHue,
    });
    result.push(oklchToHex(color));
  }

  return result;
}

// ============================================================================
// Accessibility Validation
// ============================================================================

/**
 * Result of color pair validation
 */
export interface ColorPairValidation {
  /** WCAG contrast ratio (1-21) */
  contrast: number;
  /** Meets WCAG AA for normal text (4.5:1) */
  meetsAA: boolean;
  /** Meets WCAG AA for large text (3:1) */
  meetsAALarge: boolean;
  /** Meets WCAG AAA for normal text (7:1) */
  meetsAAA: boolean;
  /** Meets WCAG AAA for large text (4.5:1) */
  meetsAAALarge: boolean;
  /** Suggested level based on contrast ratio */
  level: "fail" | "AA-large" | "AA" | "AAA";
}

/**
 * Validate a foreground/background color pair for accessibility
 *
 * Returns comprehensive WCAG compliance information including contrast ratio,
 * AA/AAA compliance for both normal and large text, and a suggested level.
 *
 * @param fg - Foreground color (hex string)
 * @param bg - Background color (hex string)
 * @returns Validation result with contrast and compliance info
 *
 * @example
 * ```typescript
 * const result = validateColorPair("#000000", "#ffffff");
 * // {
 * //   contrast: 21,
 * //   meetsAA: true,
 * //   meetsAALarge: true,
 * //   meetsAAA: true,
 * //   meetsAAALarge: true,
 * //   level: "AAA"
 * // }
 *
 * const poor = validateColorPair("#777777", "#888888");
 * // { contrast: 1.13, meetsAA: false, ..., level: "fail" }
 * ```
 */
export function validateColorPair(fg: string, bg: string): ColorPairValidation {
  const contrast = wcagContrast(fg, bg);
  const meetsAA = meetsWcagAA(fg, bg, false);
  const meetsAALarge = meetsWcagAA(fg, bg, true);
  const meetsAAA = meetsWcagAAA(fg, bg, false);
  const meetsAAALarge = meetsWcagAAA(fg, bg, true);

  let level: ColorPairValidation["level"];
  if (meetsAAA) {
    level = "AAA";
  } else if (meetsAA) {
    level = "AA";
  } else if (meetsAALarge) {
    level = "AA-large";
  } else {
    level = "fail";
  }

  return {
    contrast,
    meetsAA,
    meetsAALarge,
    meetsAAA,
    meetsAAALarge,
    level,
  };
}

/**
 * Find a color that meets contrast requirements against a background
 *
 * Adjusts the lightness of a color until it meets the specified contrast ratio.
 * Useful for automatically fixing accessibility issues.
 *
 * @param color - Color to adjust (hex string)
 * @param background - Background color (hex string)
 * @param targetContrast - Minimum contrast ratio to achieve (default: 4.5 for AA)
 * @returns Adjusted hex color, or null if impossible within gamut
 *
 * @example
 * ```typescript
 * // Fix a light gray that doesn't meet AA on white
 * const fixed = findAccessibleColor("#aaaaaa", "#ffffff", 4.5);
 * // Returns a darker gray that meets 4.5:1 contrast
 * ```
 */
export function findAccessibleColor(
  color: string,
  background: string,
  targetContrast: number = 4.5
): string | null {
  const currentContrast = wcagContrast(color, background);
  if (currentContrast >= targetContrast) {
    return color;
  }

  const oklch = hexToOklch(color);
  const bgOklch = hexToOklch(background);

  // Determine if we need to go lighter or darker
  // If background is dark, we need to go lighter; if light, go darker
  const needsLighter = bgOklch.l < 0.5;

  // Binary search for the right lightness
  let lo = needsLighter ? oklch.l : 0;
  let hi = needsLighter ? 1 : oklch.l;
  let bestColor: string | null = null;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const testColor = clampToSrgbGamut({ l: mid, c: oklch.c, h: oklch.h });
    const testHex = oklchToHex(testColor);
    const testContrast = wcagContrast(testHex, background);

    if (testContrast >= targetContrast) {
      bestColor = testHex;
      // Try to find a closer match
      if (needsLighter) {
        hi = mid;
      } else {
        lo = mid;
      }
    } else {
      if (needsLighter) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
  }

  return bestColor;
}

// ============================================================================
// Token Helpers
// ============================================================================

/**
 * Convert an OKLCH color to CSS oklch() function string
 *
 * @param color - OKLCH color object
 * @returns CSS oklch() string
 *
 * @example
 * ```typescript
 * const css = toCssOklch({ l: 0.7, c: 0.15, h: 220 });
 * // "oklch(0.7 0.15 220)"
 * ```
 */
export function toCssOklch(color: OklchColor): string {
  return `oklch(${color.l.toFixed(3)} ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

/**
 * Parse a CSS oklch() string to an OKLCH color object
 *
 * @param css - CSS oklch() string (e.g., "oklch(0.7 0.15 220)")
 * @returns OKLCH color object, or null if invalid
 *
 * @example
 * ```typescript
 * const color = parseCssOklch("oklch(0.7 0.15 220)");
 * // { l: 0.7, c: 0.15, h: 220 }
 * ```
 */
export function parseCssOklch(css: string): OklchColor | null {
  const match = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/i);
  if (!match) return null;

  const l = parseFloat(match[1]);
  const c = parseFloat(match[2]);
  const h = parseFloat(match[3]);

  if (isNaN(l) || isNaN(c) || isNaN(h)) return null;

  return { l, c, h };
}
