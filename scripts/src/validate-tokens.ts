#!/usr/bin/env node
/**
 * Validate design system tokens across theme packages.
 *
 * This script ensures all theme packages define the required CSS custom properties
 * needed by the design system components.
 *
 * Usage:
 *   pnpm tsx scripts/src/validate-tokens.ts
 *   pnpm validate:tokens  (via root package.json script)
 */

import * as fs from "fs";
import * as path from "path";

// Required tokens that every theme must define in :root
const REQUIRED_TOKENS = [
  // Semantic colors
  "--color-bg",
  "--color-fg",
  "--color-primary",
  "--color-primary-fg",
  "--color-accent",
  "--color-accent-fg",
  "--color-danger",
  "--color-danger-fg",
  "--color-success",
  "--color-success-fg",
  "--color-warning",
  "--color-warning-fg",
  "--color-info",
  "--color-info-fg",
  "--color-muted",
  "--color-fg-muted",
  "--color-muted-fg",

  // Surfaces
  "--surface-1",
  "--surface-2",
  "--surface-3",
  "--surface-input",

  // Borders
  "--border-1",
  "--border-2",
  "--border-3",

  // Focus ring
  "--color-focus-ring",
  "--ring",
  "--ring-offset",
  "--ring-width",
  "--ring-offset-width",

  // Typography (font families)
  "--font-sans",
  "--font-mono",
  "--font-body",
  "--font-heading-1",
  "--font-heading-2",

  // Typography scale (font sizes)
  "--text-xs",
  "--text-sm",
  "--text-base",
  "--text-lg",
  "--text-xl",
  "--text-2xl",
  "--text-3xl",

  // Font weights
  "--font-weight-light",
  "--font-weight-normal",
  "--font-weight-medium",
  "--font-weight-semibold",
  "--font-weight-bold",

  // Line heights
  "--leading-none",
  "--leading-tight",
  "--leading-normal",
  "--leading-relaxed",

  // Spacing (core scale)
  "--space-0",
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-8",

  // Radii
  "--radius-none",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-full",

  // Elevation
  "--elevation-0",
  "--elevation-1",
  "--elevation-2",
  "--elevation-3",

  // Z-index (DECISION-08)
  "--z-base",
  "--z-modal-backdrop",
  "--z-modal",
  "--z-popover",
  "--z-tooltip",
  "--z-toast",
];

// Warning tokens - recommended but not required
const RECOMMENDED_TOKENS = [
  "--space-10",
  "--space-12",
  "--space-16",
  "--radius-xs",
  "--radius-xl",
  "--radius-2xl",
  "--radius-3xl",
  "--radius-4xl",
  "--elevation-4",
  "--elevation-5",
  "--gradient-hero-from",
  "--gradient-hero-via",
  "--gradient-hero-to",
  "--hero-contrast-overlay",
  "--bp-xs",
  "--bp-sm",
  "--bp-md",
  "--bp-lg",
  "--bp-xl",
  "--target-min-aa",
  "--target-hig",
  "--target-material",
  // Extended typography
  "--text-4xl",
  "--text-5xl",
  "--leading-snug",
  "--leading-loose",
  // Extended z-index
  "--z-dropdown",
  "--z-sticky",
  "--z-fixed",
  "--z-max",
];

interface TokenValidationResult {
  themePath: string;
  themeName: string;
  isBaseTheme: boolean;
  missingRequired: string[];
  missingRecommended: string[];
  definedTokens: string[];
}

// Themes that must define ALL required tokens (not layered on base)
const BASE_THEMES = ["base"];

function getThemeName(themePath: string): string {
  const dir = path.dirname(themePath);
  const parent = path.basename(dir);
  if (parent === "src") {
    return path.basename(path.dirname(dir));
  }
  return parent;
}

function extractTokensFromCSS(cssContent: string): string[] {
  const tokens: string[] = [];
  // Match CSS custom property definitions: --token-name: value;
  const tokenRegex = /--([\w-]+)\s*:/g;
  let match;
  while ((match = tokenRegex.exec(cssContent)) !== null) {
    tokens.push(`--${match[1]}`);
  }
  // Deduplicate (tokens may be defined multiple times for different contexts)
  return [...new Set(tokens)];
}

function validateTheme(themePath: string): TokenValidationResult {
  const themeName = getThemeName(themePath);
  const cssContent = fs.readFileSync(themePath, "utf-8");
  const definedTokens = extractTokensFromCSS(cssContent);
  const isBaseTheme = BASE_THEMES.includes(themeName);

  // Only base themes need ALL required tokens; derivative themes layer on top
  const missingRequired = isBaseTheme
    ? REQUIRED_TOKENS.filter((token) => !definedTokens.includes(token))
    : [];
  const missingRecommended = isBaseTheme
    ? RECOMMENDED_TOKENS.filter((token) => !definedTokens.includes(token))
    : [];

  return {
    themePath,
    themeName,
    isBaseTheme,
    missingRequired,
    missingRecommended,
    definedTokens,
  };
}

function main(): void {
  const repoRoot = process.cwd();

  console.log("\n🎨 Design System Token Validation\n");
  console.log("─".repeat(60));

  // Discover theme packages that have tokens.css
  const themesDir = path.join(repoRoot, "packages/themes");
  const themePaths: string[] = [];

  if (fs.existsSync(themesDir)) {
    for (const themeDir of fs.readdirSync(themesDir)) {
      const rootTokens = path.join(themesDir, themeDir, "tokens.css");
      if (fs.existsSync(rootTokens)) {
        themePaths.push(rootTokens);
        continue;
      }
    }
  }

  if (themePaths.length === 0) {
    console.log("⚠️  No theme packages found at packages/themes/*/tokens.css");
    process.exit(0);
  }

  console.log(`Found ${themePaths.length} theme package(s):\n`);

  let hasErrors = false;
  let hasWarnings = false;

  for (const themePath of themePaths) {
    const result = validateTheme(themePath);
    const relPath = path.relative(repoRoot, themePath);

    const themeType = result.isBaseTheme ? "base theme" : "derivative theme";
    console.log(`📦 ${result.themeName} (${relPath}) [${themeType}]`);
    console.log(`   Defined tokens: ${result.definedTokens.length}`);

    if (result.isBaseTheme) {
      if (result.missingRequired.length > 0) {
        hasErrors = true;
        console.log(`   ❌ Missing required tokens (${result.missingRequired.length}):`);
        for (const token of result.missingRequired) {
          console.log(`      - ${token}`);
        }
      } else {
        console.log(`   ✅ All required tokens present`);
      }

      if (result.missingRecommended.length > 0) {
        hasWarnings = true;
        console.log(`   ⚠️  Missing recommended tokens (${result.missingRecommended.length}):`);
        for (const token of result.missingRecommended.slice(0, 5)) {
          console.log(`      - ${token}`);
        }
        if (result.missingRecommended.length > 5) {
          console.log(`      ... and ${result.missingRecommended.length - 5} more`);
        }
      }
    } else {
      console.log(`   ℹ️  Derivative theme (layers on top of base)`);
    }

    console.log();
  }

  console.log("─".repeat(60));

  if (hasErrors) {
    console.log("❌ Validation FAILED - missing required tokens\n");
    console.log("Add the missing tokens to your theme's tokens.css file.");
    console.log("See @themes/base/tokens.css for reference.\n");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("✅ Validation PASSED with warnings\n");
    console.log("Consider adding recommended tokens for full design system support.\n");
    process.exit(0);
  } else {
    console.log("✅ Validation PASSED - all themes are complete\n");
    process.exit(0);
  }
}

try {
  main();
} catch (err) {
  console.error("Token validation failed:", err);
  process.exit(1);
}
