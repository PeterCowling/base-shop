#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- Script writes within guides content directory */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [guideKey, title] = process.argv.slice(2);

if (!guideKey || !title) {
  console.error("Usage: pnpm --filter @apps/brikette create-guide <guideKey> <title>");
  process.exit(1);
}

if (!/^[a-z][a-zA-Z0-9]*$/u.test(guideKey)) {
  console.error("Error: guideKey must be camelCase (e.g., myNewGuide)");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const contentDir = path.join(appRoot, "src", "locales", "en", "guides", "content");
const contentPath = path.join(contentDir, `${guideKey}.json`);

try {
  await access(contentPath);
  console.error(`Error: Guide "${guideKey}" already exists at ${contentPath}`);
  process.exit(1);
} catch {
  // File does not exist, continue.
}

const scaffold = {
  seo: {
    title,
  },
  linkLabel: title,
  intro: [],
  sections: [],
  faqs: [],
};

await mkdir(contentDir, { recursive: true });
await writeFile(contentPath, `${JSON.stringify(scaffold, null, 2)}\n`, "utf8");

console.log(`✅ Created ${contentPath}`);
console.log("\nNext steps (manual):");
console.log("1) Add entry to guide manifest: apps/brikette/src/routes/guides/guide-manifest.ts");
console.log("2) Update guide slug map if needed: apps/brikette/src/guides/slugs/");
console.log("3) Add tag index entries if applicable: apps/brikette/src/routes/guides/tags");
console.log("4) Translate content in other locales as needed");
