// scripts/generate-meta.ts

import { generateMeta, type ProductData } from "@acme/lib/generateMeta";
import { promises as fs } from "node:fs";

// CLI usage: tsx scripts/generate-meta.ts path/to/product.json
if (process.argv[1] && process.argv[1].endsWith("generate-meta.ts")) {
  (async () => {
    const input = process.argv[2];
    if (!input) {
      console.error("Usage: generate-meta.ts ");
      process.exit(1);
    }
    const raw = await fs.readFile(input, "utf8");
    const product = JSON.parse(raw) as ProductData;
    const result = await generateMeta(product);
    console.log(JSON.stringify(result, null, 2));
  })();
}
