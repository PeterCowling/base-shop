#!/usr/bin/env tsx
/**
 * Generate cover-me-pretty theme tokens CSS from structured data.
 *
 * Produces apps/cover-me-pretty/src/app/theme-tokens.generated.css
 * from the three-layer system (assets + profile + config).
 *
 * cover-me-pretty is light-only. The compiler emits a .dark { color-scheme: dark; }
 * block with no custom properties — this is accepted shipped behavior.
 *
 * Usage:
 *   pnpm --filter scripts cover-me-pretty:generate-theme-tokens
 *   # or directly:
 *   tsx scripts/cover-me-pretty/generate-theme-tokens.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../../packages/themes/cover-me-pretty/src/assets.ts";
import { profile } from "../../packages/themes/cover-me-pretty/src/design-profile.ts";
import { themeCSSConfig } from "../../packages/themes/cover-me-pretty/src/theme-css-config.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../../apps/cover-me-pretty/src/app/theme-tokens.generated.css",
);

const banner = `/* ═══════════════════════════════════════════════════════════════════════
 * AUTO-GENERATED — do not edit manually.
 * Source: packages/themes/cover-me-pretty/src/ (assets.ts, design-profile.ts, theme-css-config.ts)
 * Generator: scripts/cover-me-pretty/generate-theme-tokens.ts
 * Regenerate: pnpm --filter scripts cover-me-pretty:generate-theme-tokens
 * ═══════════════════════════════════════════════════════════════════════ */

`;

const css = generateThemeCSS({
  assets,
  profile,
  config: themeCSSConfig,
});

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, banner + css, "utf8");

const varCount = (css.match(/--[\w-]+\s*:/g) ?? []).length;
console.log(`✓ Generated ${OUTPUT_PATH}`);
console.log(`  ${varCount} CSS custom properties (light + dark)`);
