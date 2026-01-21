/**
 * Color palette generator for theme creation.
 *
 * Generates WCAG 2.1 AA compliant color palettes from a single brand color.
 * Uses HSL color space manipulation with contrast ratio validation.
 */

// HSL color representation
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// RGB color representation (0-255 each)
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Generated palette shade
export interface PaletteShade {
  shade: number;
  hsl: HSLColor;
  hex: string;
  /** HSL string for CSS (e.g., "220 90% 56%") */
  cssValue: string;
  /** Contrast ratio against white */
  contrastOnWhite: number;
  /** Contrast ratio against black */
  contrastOnBlack: number;
  /** Whether this shade meets AA for normal text on white */
  aaOnWhite: boolean;
  /** Whether this shade meets AA for normal text on black */
  aaOnBlack: boolean;
}

// Full generated palette
export interface ColorPalette {
  primary: HSLColor;
  shades: PaletteShade[];
  /** Recommended shade for text on white backgrounds */
  textOnWhite: number;
  /** Recommended shade for text on black backgrounds */
  textOnBlack: number;
  /** Primary brand shade (typically 500) */
  brandShade: number;
}

// Standard shade values
const SHADE_VALUES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * Parse a hex color string to HSL.
 */
export function hexToHsl(hex: string): HSLColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Parse a hex color string to RGB.
 */
export function hexToRgb(hex: string): RGBColor {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, '');

  // Handle shorthand (e.g., #fff)
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  if (fullHex.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return { r, g, b };
}

/**
 * Convert RGB to HSL.
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    // Achromatic
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB.
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Convert HSL to hex string.
 */
export function hslToHex(hsl: HSLColor): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * Convert RGB to hex string.
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Format HSL as CSS value (e.g., "220 90% 56%").
 */
export function hslToCssValue(hsl: HSLColor): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Calculate relative luminance of a color (for WCAG contrast).
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function relativeLuminance(rgb: RGBColor): number {
  const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  const linear = sRGB.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/**
 * Calculate contrast ratio between two colors.
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function contrastRatio(rgb1: RGBColor, rgb2: RGBColor): number {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** White color for contrast calculations */
const WHITE: RGBColor = { r: 255, g: 255, b: 255 };
/** Black color for contrast calculations */
const BLACK: RGBColor = { r: 0, g: 0, b: 0 };

/** WCAG AA minimum contrast ratio for normal text */
const AA_NORMAL_TEXT = 4.5;
/** WCAG AA minimum contrast ratio for large text */
const AA_LARGE_TEXT = 3.0;

/**
 * Generate lightness values for each shade.
 * Maps shade numbers to target lightness values.
 */
function getLightnessForShade(shade: number, baseLightness: number): number {
  // Map shade to target lightness
  // 50 = lightest (~97%), 950 = darkest (~4%)
  const lightnessMap: Record<number, number> = {
    50: 97,
    100: 94,
    200: 86,
    300: 76,
    400: 64,
    500: 50, // Base brand color
    600: 42,
    700: 35,
    800: 26,
    900: 18,
    950: 10,
  };

  // Adjust based on the input color's lightness
  // If the input is very light or dark, compress the range
  const targetLightness = lightnessMap[shade];
  if (targetLightness === undefined) {
    throw new Error(`Invalid shade: ${shade}`);
  }

  // Slight adjustment to keep brand color recognizable
  if (shade === 500) {
    // Keep the original lightness for the brand shade if it's reasonable
    if (baseLightness >= 40 && baseLightness <= 60) {
      return baseLightness;
    }
  }

  return targetLightness;
}

/**
 * Generate a shade variant of a color.
 */
function generateShade(baseHsl: HSLColor, shade: number): PaletteShade {
  const lightness = getLightnessForShade(shade, baseHsl.l);

  // Slightly desaturate lighter shades, increase saturation for darker
  let saturation = baseHsl.s;
  if (shade <= 100) {
    saturation = Math.max(20, baseHsl.s * 0.4);
  } else if (shade <= 300) {
    saturation = Math.max(30, baseHsl.s * 0.7);
  } else if (shade >= 800) {
    saturation = Math.min(100, baseHsl.s * 1.1);
  }

  const hsl: HSLColor = {
    h: baseHsl.h,
    s: Math.round(saturation),
    l: lightness,
  };

  const rgb = hslToRgb(hsl);
  const hex = rgbToHex(rgb);
  const cssValue = hslToCssValue(hsl);
  const contrastOnWhite = contrastRatio(rgb, WHITE);
  const contrastOnBlack = contrastRatio(rgb, BLACK);

  return {
    shade,
    hsl,
    hex,
    cssValue,
    contrastOnWhite,
    contrastOnBlack,
    aaOnWhite: contrastOnWhite >= AA_NORMAL_TEXT,
    aaOnBlack: contrastOnBlack >= AA_NORMAL_TEXT,
  };
}

/**
 * Find the best shade for text on a given background.
 */
function findBestTextShade(shades: PaletteShade[], onWhite: boolean): number {
  const minContrast = AA_NORMAL_TEXT;
  const candidates = shades.filter((s) =>
    onWhite ? s.contrastOnWhite >= minContrast : s.contrastOnBlack >= minContrast
  );

  if (candidates.length === 0) {
    // Fallback to extremes
    return onWhite ? 900 : 100;
  }

  // For text on white, prefer darker shades (600-800 range looks best)
  // For text on black, prefer lighter shades (200-400 range)
  if (onWhite) {
    const preferred = candidates.filter((s) => s.shade >= 600 && s.shade <= 800);
    return preferred.length > 0 ? preferred[0].shade : candidates[candidates.length - 1].shade;
  } else {
    const preferred = candidates.filter((s) => s.shade >= 200 && s.shade <= 400);
    return preferred.length > 0 ? preferred[0].shade : candidates[0].shade;
  }
}

/**
 * Generate a full color palette from a hex color.
 */
export function generatePalette(hexColor: string): ColorPalette {
  const primary = hexToHsl(hexColor);
  const shades = SHADE_VALUES.map((shade) => generateShade(primary, shade));

  return {
    primary,
    shades,
    textOnWhite: findBestTextShade(shades, true),
    textOnBlack: findBestTextShade(shades, false),
    brandShade: 500,
  };
}

/**
 * Generate complementary/accent color from primary.
 * Uses color wheel offset for visual harmony.
 */
export function generateAccentColor(primary: HSLColor, offset = 40): HSLColor {
  return {
    h: (primary.h + offset) % 360,
    s: Math.round(Math.min(100, primary.s * 1.1)),
    l: primary.l,
  };
}

/**
 * Generate a secondary color (typically more muted).
 */
export function generateSecondaryColor(primary: HSLColor): HSLColor {
  return {
    h: (primary.h + 180) % 360, // Complementary
    s: Math.max(20, primary.s * 0.5), // More muted
    l: primary.l,
  };
}

/**
 * Semantic color defaults for themes.
 * These are standard values that work well across themes.
 */
export const SEMANTIC_COLORS = {
  success: { h: 142, s: 72, l: 40 },
  warning: { h: 40, s: 90, l: 50 },
  danger: { h: 0, s: 72, l: 51 },
  info: { h: 210, s: 90, l: 50 },
} as const;

/**
 * Adjust a semantic color to harmonize with the primary color.
 */
export function harmonizeSemanticColor(semantic: HSLColor, primary: HSLColor): HSLColor {
  // Slight hue shift toward primary (10% influence)
  const hueDiff = ((primary.h - semantic.h + 180) % 360) - 180;
  const adjustedHue = (semantic.h + hueDiff * 0.1 + 360) % 360;

  return {
    h: Math.round(adjustedHue),
    s: semantic.s,
    l: semantic.l,
  };
}

/**
 * Validate that a color meets accessibility requirements.
 */
export interface AccessibilityResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

export function validateAccessibility(palette: ColorPalette): AccessibilityResult {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check if we have usable text colors
  const hasTextOnWhite = palette.shades.some((s) => s.aaOnWhite);
  const hasTextOnBlack = palette.shades.some((s) => s.aaOnBlack);

  if (!hasTextOnWhite) {
    issues.push('No shades meet AA contrast on white backgrounds');
    suggestions.push('Consider using a darker or more saturated primary color');
  }

  if (!hasTextOnBlack) {
    issues.push('No shades meet AA contrast on black backgrounds');
    suggestions.push('Consider using a lighter primary color for dark mode');
  }

  // Check 500 shade (brand color) accessibility
  const brandShade = palette.shades.find((s) => s.shade === 500);
  if (brandShade) {
    if (brandShade.contrastOnWhite < AA_LARGE_TEXT && brandShade.contrastOnBlack < AA_LARGE_TEXT) {
      suggestions.push(
        `Brand color (${brandShade.hex}) has low contrast. Consider using shade 600 or 700 for buttons.`
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
}
