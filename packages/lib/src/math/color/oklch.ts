/**
 * OKLCH Color Utilities - Perceptually uniform color manipulation
 *
 * OKLCH is a perceptual color space that provides uniform perceptual
 * differences across the gamut. It's ideal for:
 * - Generating visually smooth gradients
 * - Checking if two colors are perceptually distinguishable
 * - Creating color palettes with consistent visual spacing
 *
 * **Important**: WCAG luminance-based contrast remains the accessibility gate.
 * OKLCH/ΔE are for token spacing and gradient quality, not accessibility compliance.
 *
 * @see Björn Ottosson, "A perceptual color space for image processing"
 * @see https://bottosson.github.io/posts/oklab/
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Color in OKLCH color space (Oklch - perceptual lightness, chroma, hue)
 */
export interface OklchColor {
  /** Lightness [0, 1] where 0 is black and 1 is white */
  l: number;
  /** Chroma [0, ~0.4] - colorfulness/saturation. 0 is achromatic */
  c: number;
  /** Hue [0, 360) in degrees */
  h: number;
}

/**
 * Color in Oklab color space (intermediate for conversions)
 */
interface OklabColor {
  /** Lightness [0, 1] */
  L: number;
  /** Green-red axis */
  a: number;
  /** Blue-yellow axis */
  b: number;
}

/**
 * RGB color tuple [0-255]
 */
export type RgbTuple = [r: number, g: number, b: number];

/**
 * Linear RGB tuple [0-1]
 */
type LinearRgbTuple = [r: number, g: number, b: number];

// ============================================================================
// Constants
// ============================================================================

// Matrix for linear sRGB to LMS (Oklab intermediate)
// prettier-ignore
const SRGB_TO_LMS = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
] as const;

// Matrix for LMS to Oklab
// prettier-ignore
const LMS_TO_OKLAB = [
  [0.2104542553, 0.7936177850, -0.0040720468],
  [1.9779984951, -2.4285922050, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.8086757660],
] as const;

// Inverse: LMS to linear sRGB
// prettier-ignore
const LMS_TO_SRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.7076147010],
] as const;

// Inverse: Oklab to LMS
// prettier-ignore
const OKLAB_TO_LMS = [
  [1.0, 0.3963377774, 0.2158037573],
  [1.0, -0.1055613458, -0.0638541728],
  [1.0, -0.0894841775, -1.2914855480],
] as const;

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Convert sRGB component [0-255] to linear RGB [0-1]
 */
function srgbToLinear(value: number): number {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB [0-1] to sRGB component [0-255]
 */
function linearToSrgb(value: number): number {
  const v = Math.max(0, Math.min(1, value));
  const srgb = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, srgb * 255)));
}

/**
 * Matrix multiplication for 3x3 matrix and 3-vector
 */
function multiplyMatrix(
  matrix: readonly (readonly [number, number, number])[],
  vector: readonly [number, number, number]
): [number, number, number] {
  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

/**
 * Convert Oklab to OKLCH (polar form)
 */
function oklabToOklch(lab: OklabColor): OklchColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (h < 0) h += 360;
  // For achromatic colors (c ≈ 0), hue is undefined; default to 0
  return { l: lab.L, c, h: c < 0.0001 ? 0 : h };
}

/**
 * Convert OKLCH to Oklab (rectangular form)
 */
function oklchToOklab(lch: OklchColor): OklabColor {
  const hRad = (lch.h * Math.PI) / 180;
  return {
    L: lch.l,
    a: lch.c * Math.cos(hRad),
    b: lch.c * Math.sin(hRad),
  };
}

// ============================================================================
// Core Conversions: sRGB ↔ OKLCH
// ============================================================================

/**
 * Convert sRGB [0-255] to OKLCH
 *
 * @param r - Red [0-255]
 * @param g - Green [0-255]
 * @param b - Blue [0-255]
 * @returns OKLCH color
 *
 * @example
 * ```typescript
 * const oklch = srgbToOklch(255, 128, 0); // Orange
 * // { l: 0.79, c: 0.17, h: 55 }
 * ```
 */
export function srgbToOklch(r: number, g: number, b: number): OklchColor {
  // sRGB to linear RGB
  const linearRgb: LinearRgbTuple = [
    srgbToLinear(r),
    srgbToLinear(g),
    srgbToLinear(b),
  ];

  // Linear RGB to LMS
  const lms = multiplyMatrix(SRGB_TO_LMS, linearRgb);

  // Apply cube root (LMS to Oklab intermediate)
  const lms_ = lms.map((v) => Math.cbrt(v)) as [number, number, number];

  // LMS' to Oklab
  const [L, a, bLab] = multiplyMatrix(LMS_TO_OKLAB, lms_);

  return oklabToOklch({ L, a, b: bLab });
}

/**
 * Convert OKLCH to sRGB [0-255]
 *
 * Note: OKLCH can represent colors outside the sRGB gamut.
 * Out-of-gamut values are clamped to [0, 255].
 *
 * @param color - OKLCH color
 * @returns RGB tuple [r, g, b] each in [0-255]
 *
 * @example
 * ```typescript
 * const [r, g, b] = oklchToSrgb({ l: 0.79, c: 0.17, h: 55 });
 * // [255, 128, 0]
 * ```
 */
export function oklchToSrgb(color: OklchColor): RgbTuple {
  const lab = oklchToOklab(color);

  // Oklab to LMS'
  const lms_ = multiplyMatrix(OKLAB_TO_LMS, [lab.L, lab.a, lab.b]);

  // Apply cube (reverse of cube root)
  const lms = lms_.map((v) => v * v * v) as [number, number, number];

  // LMS to linear RGB
  const linearRgb = multiplyMatrix(LMS_TO_SRGB, lms);

  // Linear RGB to sRGB
  return [
    linearToSrgb(linearRgb[0]),
    linearToSrgb(linearRgb[1]),
    linearToSrgb(linearRgb[2]),
  ];
}

// ============================================================================
// Hex Conversions
// ============================================================================

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Convert hex color to OKLCH
 *
 * @param hex - Hex color string (e.g., "#ff8000" or "#f80")
 * @returns OKLCH color
 * @throws Error if hex format is invalid
 *
 * @example
 * ```typescript
 * const oklch = hexToOklch("#ff8000");
 * ```
 */
export function hexToOklch(hex: string): OklchColor {
  if (!HEX_RE.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  let value = hex.slice(1);
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return srgbToOklch(r, g, b);
}

/**
 * Convert OKLCH to hex color string
 *
 * @param color - OKLCH color
 * @returns Hex color string (e.g., "#ff8000")
 *
 * @example
 * ```typescript
 * const hex = oklchToHex({ l: 0.79, c: 0.17, h: 55 });
 * // "#ff8000"
 * ```
 */
export function oklchToHex(color: OklchColor): string {
  const [r, g, b] = oklchToSrgb(color);
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

/**
 * Convert hex color to RGB tuple
 *
 * @param hex - Hex color string
 * @returns RGB tuple [0-255]
 * @throws Error if hex format is invalid
 */
export function hexToRgb(hex: string): RgbTuple {
  if (!HEX_RE.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  let value = hex.slice(1);
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }

  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

/**
 * Convert RGB tuple to hex color string
 *
 * @param rgb - RGB tuple [0-255]
 * @returns Hex color string
 */
export function rgbToHex(rgb: RgbTuple): string {
  return (
    "#" +
    rgb[0].toString(16).padStart(2, "0") +
    rgb[1].toString(16).padStart(2, "0") +
    rgb[2].toString(16).padStart(2, "0")
  );
}

// ============================================================================
// Perceptual Operations
// ============================================================================

/**
 * Calculate ΔE (perceptual color difference) in OKLCH space
 *
 * This uses Euclidean distance in Oklab space, which provides
 * perceptually uniform color differences. A ΔE of 1.0 is approximately
 * the smallest difference perceptible to the human eye.
 *
 * @param a - First OKLCH color
 * @param b - Second OKLCH color
 * @returns Perceptual difference (ΔE). Typical thresholds:
 *   - < 1: Imperceptible
 *   - 1-2: Barely perceptible
 *   - 2-10: Perceptible at a glance
 *   - 11-49: More similar than opposite
 *   - 100: Exact opposite
 *
 * @example
 * ```typescript
 * const diff = deltaE(
 *   { l: 0.7, c: 0.15, h: 30 },
 *   { l: 0.7, c: 0.15, h: 35 }
 * );
 * // Small difference due to hue shift
 * ```
 */
export function deltaE(a: OklchColor, b: OklchColor): number {
  // Convert to Oklab for Euclidean distance
  const labA = oklchToOklab(a);
  const labB = oklchToOklab(b);

  const dL = labA.L - labB.L;
  const da = labA.a - labB.a;
  const db = labA.b - labB.b;

  // Euclidean distance in Oklab space
  // Multiplied by 100 to give intuitive ΔE values similar to CIE standards
  return Math.sqrt(dL * dL + da * da + db * db) * 100;
}

/**
 * Check if two colors are visually distinguishable
 *
 * Uses ΔE threshold to determine if colors are different enough
 * to be perceived as distinct by typical human vision.
 *
 * @param a - First OKLCH color
 * @param b - Second OKLCH color
 * @param threshold - Minimum ΔE for colors to be considered distinguishable.
 *                    Default is 2.0 (clearly perceptible difference)
 * @returns True if colors are distinguishable
 *
 * @example
 * ```typescript
 * const canTell = areDistinguishable(primaryColor, secondaryColor);
 * if (!canTell) {
 *   console.warn("Design tokens too similar!");
 * }
 * ```
 */
export function areDistinguishable(
  a: OklchColor,
  b: OklchColor,
  threshold: number = 2.0
): boolean {
  return deltaE(a, b) >= threshold;
}

// ============================================================================
// Gradient/Interpolation
// ============================================================================

/**
 * Interpolate between two OKLCH colors
 *
 * Performs perceptually uniform interpolation in Oklab space,
 * then converts back to OKLCH. This produces smoother gradients
 * than interpolating in RGB or HSL.
 *
 * @param a - Start color
 * @param b - End color
 * @param t - Interpolation factor [0, 1] where 0 = a, 1 = b
 * @returns Interpolated OKLCH color
 *
 * @example
 * ```typescript
 * const midpoint = interpolateOklch(red, blue, 0.5);
 * ```
 */
export function interpolateOklch(a: OklchColor, b: OklchColor, t: number): OklchColor {
  // Clamp t to [0, 1]
  const tClamped = Math.max(0, Math.min(1, t));

  // Interpolate in Oklab space for perceptual uniformity
  const labA = oklchToOklab(a);
  const labB = oklchToOklab(b);

  const interpolatedLab: OklabColor = {
    L: labA.L + (labB.L - labA.L) * tClamped,
    a: labA.a + (labB.a - labA.a) * tClamped,
    b: labA.b + (labB.b - labA.b) * tClamped,
  };

  return oklabToOklch(interpolatedLab);
}

/**
 * Generate evenly-spaced gradient stops between two colors
 *
 * Creates perceptually uniform gradient steps using Oklab interpolation.
 * The resulting colors will appear evenly spaced to the human eye.
 *
 * @param a - Start color
 * @param b - End color
 * @param steps - Number of stops to generate (including start and end)
 * @returns Array of OKLCH colors
 *
 * @example
 * ```typescript
 * const gradient = generateGradientStops(
 *   hexToOklch("#ff0000"),
 *   hexToOklch("#0000ff"),
 *   5
 * );
 * // Returns 5 colors: red, purple-red, purple, purple-blue, blue
 * const cssGradient = gradient.map(oklchToHex).join(", ");
 * ```
 */
export function generateGradientStops(
  a: OklchColor,
  b: OklchColor,
  steps: number
): OklchColor[] {
  if (steps < 2) {
    throw new Error("Gradient requires at least 2 steps");
  }

  const result: OklchColor[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    result.push(interpolateOklch(a, b, t));
  }
  return result;
}

// ============================================================================
// WCAG Contrast (Accessibility)
// ============================================================================

/**
 * Calculate relative luminance per WCAG 2.0 specification
 *
 * This is the standard luminance calculation for accessibility contrast.
 * NOT to be confused with OKLCH lightness (L) which is perceptual.
 *
 * @param rgb - RGB tuple [0-255]
 * @returns Relative luminance [0, 1]
 *
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function relativeLuminance(rgb: RgbTuple): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate WCAG contrast ratio between two colors
 *
 * @param fg - Foreground color (hex string)
 * @param bg - Background color (hex string)
 * @returns Contrast ratio [1, 21]
 *
 * @example
 * ```typescript
 * const ratio = wcagContrast("#000000", "#ffffff");
 * // 21 (maximum contrast)
 * ```
 */
export function wcagContrast(fg: string, bg: string): number {
  const fgLum = relativeLuminance(hexToRgb(fg));
  const bgLum = relativeLuminance(hexToRgb(bg));
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color pair meets WCAG AA contrast requirements
 *
 * - Normal text: 4.5:1 minimum
 * - Large text (18pt+, or 14pt bold): 3:1 minimum
 *
 * @param fg - Foreground color (hex string)
 * @param bg - Background color (hex string)
 * @param largeText - Whether the text is large (18pt+ or 14pt bold)
 * @returns True if contrast meets AA requirements
 */
export function meetsWcagAA(fg: string, bg: string, largeText: boolean = false): boolean {
  const ratio = wcagContrast(fg, bg);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color pair meets WCAG AAA contrast requirements
 *
 * - Normal text: 7:1 minimum
 * - Large text (18pt+, or 14pt bold): 4.5:1 minimum
 *
 * @param fg - Foreground color (hex string)
 * @param bg - Background color (hex string)
 * @param largeText - Whether the text is large (18pt+ or 14pt bold)
 * @returns True if contrast meets AAA requirements
 */
export function meetsWcagAAA(fg: string, bg: string, largeText: boolean = false): boolean {
  const ratio = wcagContrast(fg, bg);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

// ============================================================================
// Gamut Mapping
// ============================================================================

/**
 * Check if an OKLCH color is within the sRGB gamut
 *
 * @param color - OKLCH color to check
 * @returns True if the color can be represented in sRGB without clipping
 */
export function isInSrgbGamut(color: OklchColor): boolean {
  const lab = oklchToOklab(color);
  const lms_ = multiplyMatrix(OKLAB_TO_LMS, [lab.L, lab.a, lab.b]);
  const lms = lms_.map((v) => v * v * v) as [number, number, number];
  const linearRgb = multiplyMatrix(LMS_TO_SRGB, lms);

  // If any linear RGB value is outside [0, 1], it's out of gamut
  // Use a tolerance of 0.001 to account for floating point precision
  const tolerance = 0.001;
  return linearRgb.every((v) => v >= -tolerance && v <= 1 + tolerance);
}

/**
 * Clamp an OKLCH color to the sRGB gamut by reducing chroma
 *
 * Uses binary search to find the maximum chroma that stays within gamut.
 * This preserves lightness and hue while reducing saturation.
 *
 * @param color - OKLCH color (may be out of gamut)
 * @returns OKLCH color guaranteed to be in sRGB gamut
 */
export function clampToSrgbGamut(color: OklchColor): OklchColor {
  if (isInSrgbGamut(color)) {
    return color;
  }

  // Binary search for maximum in-gamut chroma
  let lo = 0;
  let hi = color.c;
  let result = { ...color, c: 0 };

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const test = { ...color, c: mid };
    if (isInSrgbGamut(test)) {
      result = test;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return result;
}
