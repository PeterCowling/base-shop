#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const globalCssPath = path.resolve(__dirname, "../src/styles/global.css");
const importPattern = /@import\s+["']@themes\/base\/src\/tokens\.css["'];/;

let contents = "";
try {
  contents = fs.readFileSync(globalCssPath, "utf8");
} catch (error) {
  console.error(`[style-check] Failed to read ${globalCssPath}`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (!importPattern.test(contents)) {
  console.error(
    "[style-check] Missing @themes/base token import in global.css. Add:",
    '@import \"@themes/base/src/tokens.css\";',
  );
  process.exit(1);
}

console.log("[style-check] Base theme tokens import found.");
