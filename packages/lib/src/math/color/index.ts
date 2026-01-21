/**
 * OKLCH Color Utilities
 *
 * Perceptually uniform color manipulation for design systems.
 *
 * @module @acme/lib/math/color
 */

export {
  areDistinguishable,
  clampToSrgbGamut,
  // Perceptual operations
  deltaE,
  generateGradientStops,
  hexToOklch,
  hexToRgb,
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
  rgbToHex,
  type RgbTuple,
  // Core conversions
  srgbToOklch,
  wcagContrast,
} from "./oklch";
