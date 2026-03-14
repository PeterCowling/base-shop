/**
 * Generate theme-tokens.generated.css for xa-b.
 *
 * Usage: npx tsx packages/themes/xa-b/scripts/generate.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "@themes/base";

import { assets } from "../src/assets";
import { profile } from "../src/design-profile";
import { themeCSSConfig } from "../src/theme-css-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const css = generateThemeCSS({ assets, profile, config: themeCSSConfig });

const outPath = path.resolve(
  __dirname,
  "../../../../apps/xa-b/src/styles/theme-tokens.generated.css",
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, css, "utf8");

console.info(`Generated ${outPath} (${css.length} bytes)`);
