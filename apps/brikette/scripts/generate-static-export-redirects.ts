import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildLocalizedStaticRedirectRules,
  formatRedirectRules,
} from "../src/routing/staticExportRedirects";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const REDIRECTS_PATH = path.join(APP_ROOT, "public", "_redirects");

const START_MARKER = "# BEGIN GENERATED LOCALIZED STATIC-EXPORT REDIRECTS";
const END_MARKER = "# END GENERATED LOCALIZED STATIC-EXPORT REDIRECTS";

async function main(): Promise<void> {
  const generatedRules = formatRedirectRules(buildLocalizedStaticRedirectRules());

  const fileLines = [
    "# Cloudflare Pages redirects",
    "# https://developers.cloudflare.com/pages/configuration/redirects/",
    "# This file is deployed alongside static HTML for edge-level redirects",
    "",
    "# Root URL -> English homepage (no middleware on static deploy)",
    "/  /en/  302",
    "",
    "# Health check endpoint -> homepage (no API routes on static deploy)",
    "/api/health  /en/  302",
    "",
    "# Legacy /directions/* URLs (no lang prefix) -> English how-to-get-here routes",
    "/directions/:slug  /en/how-to-get-here/:slug  301",
    "",
    `${START_MARKER}`,
    ...generatedRules,
    `${END_MARKER}`,
    "",
  ];

  await writeFile(REDIRECTS_PATH, `${fileLines.join("\n")}`, "utf8");
  console.log(`Updated ${REDIRECTS_PATH} with ${generatedRules.length} generated redirect rules.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
