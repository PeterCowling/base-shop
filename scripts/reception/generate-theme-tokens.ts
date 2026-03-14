#!/usr/bin/env tsx
/**
 * Generate reception theme tokens CSS from structured data.
 *
 * Produces apps/reception/src/styles/theme-tokens.generated.css
 * from the compiler pipeline (assets + profile + theme-css-config).
 *
 * The generated file is a known superset of packages/themes/reception/tokens.css.
 * It adds two compiler-mandated properties:
 *   - `color-scheme: light;` / `color-scheme: dark;` in the light and dark blocks
 *   - `--theme-transition-duration: 200ms` (from profile.motion.durationNormal)
 * All token vars and values are otherwise identical to tokens.css.
 *
 * Dark mode strategy:
 *   - The compiler emits an `html.theme-dark { ... }` block (darkSelector in config).
 *   - This script post-processes that block to also emit an
 *     `@media (prefers-color-scheme: dark) { :root { ... } }` block with
 *     the same dark var assignments — matching the current tokens.css structure.
 *
 * Usage:
 *   pnpm --filter scripts reception:generate-theme-tokens
 *   # or directly:
 *   tsx scripts/reception/generate-theme-tokens.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../../packages/themes/reception/src/assets.ts";
import { profile } from "../../packages/themes/reception/src/design-profile.ts";
import { themeCSSConfig } from "../../packages/themes/reception/src/theme-css-config.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../apps/reception/src/styles/theme-tokens.generated.css",
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract CSS custom property lines from a named selector block.
 * Returns the lines between the outermost { } of the first matching selector.
 */
function extractBlockLines(css: string, selector: string): string[] {
  const idx = css.indexOf(selector);
  if (idx === -1) return [];
  const openBrace = css.indexOf("{", idx);
  if (openBrace === -1) return [];

  let depth = 0;
  let blockEnd = -1;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }
  if (blockEnd === -1) return [];

  const content = css.slice(openBrace + 1, blockEnd);
  return content.split("\n");
}

/**
 * Extract only the var swap lines from a dark selector block.
 * Returns lines that contain a CSS custom property declaration.
 */
function extractDarkVarLines(css: string, darkSelector: string): string[] {
  const allLines = extractBlockLines(css, darkSelector);
  return allLines.filter((l) => l.includes("--") && l.includes(":"));
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

const banner = `/* ═══════════════════════════════════════════════════════════════════════
 * AUTO-GENERATED — do not edit manually.
 * Source: packages/themes/reception/src/ (assets.ts, design-profile.ts, theme-css-config.ts)
 * Generator: scripts/reception/generate-theme-tokens.ts
 * Regenerate: pnpm --filter scripts reception:generate-theme-tokens
 *
 * Known additions vs packages/themes/reception/tokens.css:
 *   - color-scheme: light / dark (compiler-mandated)
 *   - --theme-transition-duration: 200ms (from profile.motion.durationNormal)
 * ═══════════════════════════════════════════════════════════════════════ */

`;

// Call the compiler — produces :root { } and html.theme-dark { }
const compilerOutput = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

// Post-process: extract the dark var lines from html.theme-dark { }
// and emit them a second time as @media (prefers-color-scheme: dark) :root { }
const darkVarLines = extractDarkVarLines(compilerOutput, "html.theme-dark");
const mediaBlock = [
  "@media (prefers-color-scheme: dark) {",
  "  :root {",
  ...darkVarLines.map((l) => `  ${l}`),
  "  }",
  "}",
].join("\n");

// Insert the @media block before html.theme-dark { }
const themeDarkIdx = compilerOutput.indexOf("html.theme-dark {");
const finalCSS = [
  compilerOutput.slice(0, themeDarkIdx),
  mediaBlock,
  "\n\n",
  compilerOutput.slice(themeDarkIdx),
].join("");

// Ensure the output directory exists
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, banner + finalCSS, "utf8");

const varCount = (finalCSS.match(/--[\w-]+\s*:/g) ?? []).length;
console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${varCount} CSS custom property declarations (light + dark × 3 blocks)`);
