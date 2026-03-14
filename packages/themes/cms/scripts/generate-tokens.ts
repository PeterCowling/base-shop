/**
 * CMS Theme Token Generator
 *
 * Generates apps/cms/src/app/cms.tokens.generated.css from the typed
 * @themes/cms package. Run once before committing; parity test guards drift.
 *
 * Usage: node --import tsx/esm packages/themes/cms/scripts/generate-tokens.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateThemeCSS } from "../../base/src/build-theme-css.js";
import { assets } from "../src/assets.js";
import { profile } from "../src/design-profile.js";
import { themeCSSConfig } from "../src/theme-css-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outputPath = path.resolve(
  __dirname,
  "../../../../apps/cms/src/app/cms.tokens.generated.css",
);

const header = `/* apps/cms/src/app/cms.tokens.generated.css
   AUTO-GENERATED — do not edit directly.
   Source: packages/themes/cms/src/theme-css-config.ts
   Regenerate: node --import tsx/esm packages/themes/cms/scripts/generate-tokens.ts
   Guard: packages/themes/cms/__tests__/generated-parity.test.ts */

`;

const css = generateThemeCSS({ assets, profile, config: themeCSSConfig });

fs.writeFileSync(outputPath, header + css, "utf8");
console.info(`Written: ${outputPath}`);
