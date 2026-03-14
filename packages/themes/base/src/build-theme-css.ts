/**
 * Theme CSS Bridge Compiler
 *
 * Generates the actual consumed CSS custom properties from structured
 * theme data (assets + profile). Unlike build-assets.ts (which emits
 * --asset-* prefixed vars) and build-profile.ts (which emits --profile-*
 * prefixed vars), this compiler produces the real variable names that
 * components reference: --color-brand-*, --font-*, --rgb-brand-*, etc.
 *
 * This is the bridge between the three-layer expressiveness system and
 * the hand-authored global.css tokens it replaces.
 *
 * Usage:
 * ```ts
 * import { generateThemeCSS } from "@themes/base/build-theme-css";
 * import { assets } from "@themes/brikette/assets";
 * import { profile } from "@themes/brikette/design-profile";
 *
 * const css = generateThemeCSS({ assets, profile, config });
 * ```
 */

import type { BrandColor, DesignProfile, ThemeAssets } from "./theme-expression";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeCSSConfig {
  assets: ThemeAssets;
  profile: DesignProfile;
  /**
   * Brand color var names. Maps camelCase asset key to CSS var suffix.
   * e.g. { primary: "brand-primary", bg: "brand-bg" }
   */
  colorVarMap: Record<string, string>;
  /**
   * Font var names. Maps asset font key to CSS var name.
   * e.g. { body: "font-sans", heading: "font-heading" }
   */
  fontVarMap: Record<string, string>;
  /**
   * Derived vars that are not directly from assets/profile.
   * Emitted as-is into :root and optionally .dark.
   */
  derivedVars?: {
    light: Record<string, string>;
    dark?: Record<string, string>;
  };
  /**
   * RGB triplet vars to generate. Maps asset color key to RGB var name.
   * If not provided, auto-generates --rgb-{colorVarMap[key]} for every
   * hex color in brandColors.
   */
  rgbVarMap?: Record<string, string>;
}

export interface GenerateThemeCSSOptions {
  assets: ThemeAssets;
  profile: DesignProfile;
  config: ThemeCSSConfig;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBrandColorObject(value: BrandColor | string): value is BrandColor {
  return typeof value === "object" && "light" in value;
}

/**
 * Convert a hex color (#rrggbb or #rgb) to an RGB triplet string "r g b".
 * Returns null if the color is not a valid hex.
 */
function hexToRgbTriplet(hex: string): string | null {
  const match = hex.match(/^#([0-9a-f]{3,8})$/i);
  if (!match) return null;

  let r: number, g: number, b: number;
  const h = match[1];

  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16);
    g = parseInt(h[1] + h[1], 16);
    b = parseInt(h[2] + h[2], 16);
  } else if (h.length === 6 || h.length === 8) {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    return null;
  }

  return `${r} ${g} ${b}`;
}

// ---------------------------------------------------------------------------
// Section generators
// ---------------------------------------------------------------------------

function generateLightColorVars(
  assets: ThemeAssets,
  colorVarMap: Record<string, string>,
): string[] {
  const lines: string[] = [];

  for (const [assetKey, varSuffix] of Object.entries(colorVarMap)) {
    const entry = assets.brandColors[assetKey];
    if (!entry) continue;

    const color = isBrandColorObject(entry) ? entry.light : entry;
    lines.push(`  --color-${varSuffix}: ${color};`);
  }

  return lines;
}

function generateDarkColorVars(
  assets: ThemeAssets,
  colorVarMap: Record<string, string>,
): string[] {
  const lines: string[] = [];

  for (const [assetKey, varSuffix] of Object.entries(colorVarMap)) {
    const entry = assets.brandColors[assetKey];
    if (!entry) continue;

    if (isBrandColorObject(entry) && entry.dark) {
      lines.push(`  --color-${varSuffix}: ${entry.dark};`);
    }
  }

  return lines;
}

function generateRgbTripletVars(
  assets: ThemeAssets,
  mode: "light" | "dark",
  rgbVarMap: Record<string, string>,
): string[] {
  const lines: string[] = [];

  // Only generate RGB triplets for entries explicitly listed in rgbVarMap
  for (const [assetKey, rgbVarName] of Object.entries(rgbVarMap)) {
    const entry = assets.brandColors[assetKey];
    if (!entry) continue;

    const color = mode === "dark"
      ? (isBrandColorObject(entry) ? entry.dark : null)
      : (isBrandColorObject(entry) ? entry.light : (typeof entry === "string" ? entry : null));

    if (!color) continue;

    const triplet = hexToRgbTriplet(color);
    if (!triplet) continue;

    lines.push(`  --${rgbVarName}: ${triplet};`);
  }

  return lines;
}

function generateFontVars(
  assets: ThemeAssets,
  fontVarMap: Record<string, string>,
): string[] {
  const lines: string[] = [];

  for (const [fontKey, varName] of Object.entries(fontVarMap)) {
    const font = assets.fonts[fontKey];
    if (!font) continue;
    lines.push(`  --${varName}: ${font.family};`);
  }

  return lines;
}

function generateProfileVars(profile: DesignProfile): string[] {
  return [
    `  --theme-transition-duration: ${profile.motion.durationNormal};`,
  ];
}

function generateDerivedVars(
  vars: Record<string, string>,
): string[] {
  return Object.entries(vars).map(
    ([name, value]) => `  --${name}: ${value};`,
  );
}

// ---------------------------------------------------------------------------
// Main compiler
// ---------------------------------------------------------------------------

/**
 * Generate the complete theme CSS from structured data.
 *
 * Produces:
 * - `:root { ... }` block with light-mode brand colors, fonts, profile vars,
 *   RGB triplets, and derived vars
 * - `.dark { ... }` block with dark-mode overrides
 *
 * The output is designed to be a drop-in replacement for the hand-authored
 * `:root` and `.dark` blocks in global.css.
 */
export function generateThemeCSS(options: GenerateThemeCSSOptions): string {
  const { assets, profile, config } = options;
  const sections: string[] = [];

  // ── :root block ──
  const rootLines: string[] = [];

  rootLines.push("  color-scheme: light;");
  rootLines.push("");

  // Profile vars
  rootLines.push("  /* Profile */");
  rootLines.push(...generateProfileVars(profile));
  rootLines.push("");

  // Font vars
  const fontLines = generateFontVars(assets, config.fontVarMap);
  if (fontLines.length > 0) {
    rootLines.push("  /* Fonts */");
    rootLines.push(...fontLines);
    rootLines.push("");
  }

  // Brand color vars
  const colorLines = generateLightColorVars(assets, config.colorVarMap);
  if (colorLines.length > 0) {
    rootLines.push("  /* Brand colors */");
    rootLines.push(...colorLines);
    rootLines.push("");
  }

  // RGB triplet vars
  const rgbLines = config.rgbVarMap
    ? generateRgbTripletVars(assets, "light", config.rgbVarMap)
    : [];
  if (rgbLines.length > 0) {
    rootLines.push("  /* RGB triplets for alpha support */");
    rootLines.push(...rgbLines);
    rootLines.push("");
  }

  // Derived vars (light)
  if (config.derivedVars?.light) {
    const derivedLines = generateDerivedVars(config.derivedVars.light);
    if (derivedLines.length > 0) {
      rootLines.push("  /* Derived */");
      rootLines.push(...derivedLines);
    }
  }

  sections.push(`:root {\n${rootLines.join("\n")}\n}`);

  // ── .dark block ──
  const darkLines: string[] = [];

  darkLines.push("  color-scheme: dark;");
  darkLines.push("");

  // Dark brand color vars
  const darkColorLines = generateDarkColorVars(assets, config.colorVarMap);
  if (darkColorLines.length > 0) {
    darkLines.push("  /* Brand colors */");
    darkLines.push(...darkColorLines);
    darkLines.push("");
  }

  // Dark RGB triplet vars
  const darkRgbLines = config.rgbVarMap
    ? generateRgbTripletVars(assets, "dark", config.rgbVarMap)
    : [];
  if (darkRgbLines.length > 0) {
    darkLines.push("  /* RGB triplets for alpha support */");
    darkLines.push(...darkRgbLines);
    darkLines.push("");
  }

  // Derived vars (dark)
  if (config.derivedVars?.dark) {
    const derivedDarkLines = generateDerivedVars(config.derivedVars.dark);
    if (derivedDarkLines.length > 0) {
      darkLines.push("  /* Derived */");
      darkLines.push(...derivedDarkLines);
    }
  }

  sections.push(`.dark {\n${darkLines.join("\n")}\n}`);

  return sections.join("\n\n") + "\n";
}

// Re-export for direct import
export { hexToRgbTriplet };
