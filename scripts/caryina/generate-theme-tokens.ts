#!/usr/bin/env tsx
/**
 * Generate caryina theme tokens CSS from structured data.
 *
 * Produces apps/caryina/src/styles/theme-tokens.generated.css
 * from the three-layer system (assets + profile + config).
 *
 * Usage:
 *   pnpm --filter scripts caryina:generate-theme-tokens
 *   # or directly:
 *   tsx scripts/caryina/generate-theme-tokens.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "@themes/base";
import { assets, profile, themeCSSConfig } from "@themes/caryina";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../apps/caryina/src/styles/theme-tokens.generated.css",
);

const banner = `/* ═══════════════════════════════════════════════════════════════════════
 * AUTO-GENERATED — do not edit manually.
 * Source: packages/themes/caryina/src/ (assets.ts, design-profile.ts, theme-css-config.ts)
 * Generator: scripts/caryina/generate-theme-tokens.ts
 * Regenerate: pnpm --filter scripts caryina:generate-theme-tokens
 * ═══════════════════════════════════════════════════════════════════════ */

`;

const css = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

fs.writeFileSync(OUTPUT_PATH, banner + css, "utf8");

const varCount = (css.match(/--[\w-]+\s*:/g) ?? []).length;
console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${varCount} CSS custom properties (light + dark)`);
