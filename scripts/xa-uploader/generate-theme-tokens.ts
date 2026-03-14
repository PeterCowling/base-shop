#!/usr/bin/env tsx
/**
 * Generate xa-uploader theme tokens CSS from structured data.
 *
 * Produces apps/xa-uploader/src/app/theme-tokens.generated.css
 * from the three-layer system (assets + profile + config).
 *
 * The raw output from generateThemeCSS() includes extras (color-scheme,
 * --theme-transition-duration, .dark block) that xa-uploader does not need.
 * postProcessGateCSS() strips these so the committed file contains only
 * the 17 --gate-* vars in a clean :root block.
 *
 * Usage:
 *   pnpm --filter scripts xa-uploader:generate-theme-tokens
 *   # or directly:
 *   tsx scripts/xa-uploader/generate-theme-tokens.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "@themes/base";
import { assets, postProcessGateCSS, profile, themeCSSConfig } from "@themes/xa-uploader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../apps/xa-uploader/src/app/theme-tokens.generated.css",
);

const banner = `/* ═══════════════════════════════════════════════════════════════════════
 * AUTO-GENERATED — do not edit manually.
 * Source: packages/themes/xa-uploader/src/ (assets.ts, design-profile.ts, theme-css-config.ts)
 * Generator: scripts/xa-uploader/generate-theme-tokens.ts
 * Regenerate: pnpm --filter scripts xa-uploader:generate-theme-tokens
 * ═══════════════════════════════════════════════════════════════════════ */

`;

const rawCSS = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

const css = postProcessGateCSS(rawCSS);

fs.writeFileSync(OUTPUT_PATH, banner + css, "utf8");

const varCount = (css.match(/--[\w-]+\s*:/g) ?? []).length;
console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${varCount} CSS custom properties`);
