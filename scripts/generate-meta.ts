// scripts/generate-meta.ts

import { generateMeta, type ProductData } from "@acme/lib/generateMeta";
import { promises as fs } from "node:fs";

export async function runGenerateMetaCli() {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: generate-meta.ts "); // i18n-exempt -- ENG-2002 CLI-only usage hint for generate-meta script [ttl=2026-12-31]
    process.exit(1);
    return;
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-2006: input is a developer-provided CLI file path for local tooling, not HTTP input [ttl=2026-12-31]
  const raw = await fs.readFile(input, "utf8");
  const product = JSON.parse(raw) as ProductData;
  const result = await generateMeta(product);
  console.log(JSON.stringify(result, null, 2));
}

// CLI usage: tsx scripts/generate-meta.ts path/to/product.json
if (process.argv[1] && process.argv[1].endsWith("generate-meta.ts")) {
  void runGenerateMetaCli();
}
