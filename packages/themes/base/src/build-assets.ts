/**
 * Asset CSS Generator
 *
 * Generates CSS from ThemeAssets definitions:
 * - @font-face / @import declarations for fonts
 * - Font family custom properties
 * - @keyframes blocks
 * - Gradient custom properties
 * - Shadow custom properties
 * - Brand color variables (light + dark)
 *
 * Pure function: takes asset data, returns a CSS string.
 */

import type { BrandColor, GradientAsset, ThemeAssets } from "./theme-expression";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase to kebab-case */
function toKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Build a CSS selector for scoping: `:root` for base, `[data-theme="{name}"]` for app themes */
function themeSelector(themeName: string): string {
  return themeName === "base" ? ":root" : `[data-theme="${themeName}"]`;
}

/** Dark-mode selector: `.dark:root` for base, `.dark [data-theme="{name}"]` for app themes */
function darkSelector(themeName: string): string {
  return themeName === "base"
    ? ".dark:root"
    : `.dark [data-theme="${themeName}"]`;
}

/** Check whether a brand color entry has separate light/dark values */
function isBrandColorObject(value: BrandColor | string): value is BrandColor {
  return typeof value === "object" && "light" in value;
}

// ---------------------------------------------------------------------------
// Section generators
// ---------------------------------------------------------------------------

function generateFontCSS(
  fonts: ThemeAssets["fonts"],
): string {
  const entries = Object.entries(fonts);
  if (entries.length === 0) return "";

  const lines: string[] = ["/* ── Fonts ── */"];

  for (const [name, font] of entries) {
    if (font.source === "google") {
      // Google Fonts — emit @import for each weight combination
      const family = font.family.split(",")[0].trim().replace(/"/g, "");
      const weights = font.variableFont
        ? `wght@${font.weights[0]}..${font.weights[font.weights.length - 1]}`
        : `wght@${font.weights.join(";")}`;
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${weights}&display=swap`;
      lines.push(`@import url("${url}");`);
    } else {
      // Local fonts — loaded via next/font or manual @font-face elsewhere
      lines.push(`/* Font "${name}": ${font.family.split(",")[0].trim()} — loaded locally (next/font or equivalent) */`);
    }
  }

  return lines.join("\n") + "\n";
}

function generateKeyframesCSS(
  keyframes: ThemeAssets["keyframes"],
): string {
  const entries = Object.entries(keyframes);
  if (entries.length === 0) return "";

  const lines: string[] = ["/* ── Keyframes ── */"];

  for (const [name, kf] of entries) {
    lines.push(`@keyframes ${name} {`);
    lines.push("  from {");
    for (const [prop, val] of Object.entries(kf.from)) {
      lines.push(`    ${toKebab(prop)}: ${val};`);
    }
    lines.push("  }");
    lines.push("  to {");
    for (const [prop, val] of Object.entries(kf.to)) {
      lines.push(`    ${toKebab(prop)}: ${val};`);
    }
    lines.push("  }");
    lines.push("}\n");
  }

  return lines.join("\n");
}

function buildGradientValue(gradient: GradientAsset): string {
  const stops = gradient.stops
    .map((s) => `${s.color} ${s.position}`)
    .join(", ");

  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle ?? 180}deg, ${stops})`;
    case "radial":
      return `radial-gradient(${stops})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle ?? 0}deg, ${stops})`;
  }
}

function generateShadowVarsCSS(
  shadows: ThemeAssets["shadows"],
): string[] {
  return Object.entries(shadows).map(
    ([name, value]) => `  --asset-shadow-${toKebab(name)}: ${value};`
  );
}

function generateBrandColorLightVars(
  brandColors: ThemeAssets["brandColors"],
): string[] {
  return Object.entries(brandColors).map(([name, value]) => {
    const color = isBrandColorObject(value) ? value.light : value;
    return `  --asset-color-${toKebab(name)}: ${color};`;
  });
}

function generateBrandColorDarkVars(
  brandColors: ThemeAssets["brandColors"],
): string[] {
  const lines: string[] = [];
  for (const [name, value] of Object.entries(brandColors)) {
    if (isBrandColorObject(value) && value.dark) {
      lines.push(`  --asset-color-${toKebab(name)}: ${value.dark};`);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate CSS from a ThemeAssets definition.
 *
 * @param assets  - The theme's asset definitions
 * @param themeName - "base" for the base theme, or the app theme name (e.g. "caryina")
 * @returns Complete CSS string ready for inclusion in globals.css
 */
export function generateAssetCSS(
  assets: ThemeAssets,
  themeName: string,
): string {
  const isEmpty =
    Object.keys(assets.fonts).length === 0 &&
    Object.keys(assets.gradients).length === 0 &&
    Object.keys(assets.shadows).length === 0 &&
    Object.keys(assets.keyframes).length === 0 &&
    Object.keys(assets.brandColors).length === 0;

  if (isEmpty) {
    return `/* Generated by build-assets.ts — ${themeName} theme has no brand assets */\n`;
  }

  const selector = themeSelector(themeName);
  const darkSel = darkSelector(themeName);
  const sections: string[] = [
    `/* Generated by build-assets.ts — ${themeName} theme */\n`,
  ];

  // 1. Font imports / declarations (global scope — not scopeable)
  const fontCSS = generateFontCSS(assets.fonts);
  if (fontCSS) sections.push(fontCSS);

  // 2. Keyframes (global scope — not scopeable)
  const keyframesCSS = generateKeyframesCSS(assets.keyframes);
  if (keyframesCSS) sections.push(keyframesCSS);

  // 3. Scoped custom properties block (fonts, gradients, shadows, brand colors light)
  const scopedVars: string[] = [];

  // Font family vars
  const fontEntries = Object.entries(assets.fonts);
  for (const [name, font] of fontEntries) {
    scopedVars.push(`  --asset-font-${toKebab(name)}: ${font.family};`);
  }

  // Gradient vars
  for (const [name, gradient] of Object.entries(assets.gradients)) {
    scopedVars.push(`  --asset-gradient-${toKebab(name)}: ${buildGradientValue(gradient)};`);
  }

  // Shadow vars
  scopedVars.push(...generateShadowVarsCSS(assets.shadows));

  // Brand color light vars
  scopedVars.push(...generateBrandColorLightVars(assets.brandColors));

  if (scopedVars.length > 0) {
    sections.push(`${selector} {\n${scopedVars.join("\n")}\n}\n`);
  }

  // 4. Dark-mode brand color overrides
  const darkVars = generateBrandColorDarkVars(assets.brandColors);
  if (darkVars.length > 0) {
    sections.push(`${darkSel} {\n${darkVars.join("\n")}\n}\n`);
  }

  return sections.join("\n");
}
