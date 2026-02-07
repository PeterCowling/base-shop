/* eslint-disable security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] reads repo-local resources. */
import { existsSync } from "node:fs";
import path from "node:path";

import { GALLERY_IMAGE_SOURCES } from "../src/routes/guides/day-trip-capri-from-positano/constants";

const SCRIPT_DIR = path.resolve(__dirname, "..");
const PUBLIC_ROOT = path.join(SCRIPT_DIR, "public");

const missing: string[] = [];

for (const entry of GALLERY_IMAGE_SOURCES) {
  const relativePath = entry.path.replace(/^[/\\]+/, "");
  const absolutePath = path.join(PUBLIC_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    missing.push(`${entry.key} -> ${entry.path}`);
  }
}

if (missing.length > 0) {
  const sample = missing.map((line) => `- ${line}`).join("\n");
  throw new Error(
    [
      "Missing gallery assets for the Capri day-trip guide.",
      "Add the referenced images under apps/brikette/public or update the constants.",
      "Missing:",
      sample,
    ].join("\n"),
  );
}

console.log("Capri gallery assets are present.");