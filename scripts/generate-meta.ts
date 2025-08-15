import { promises as fs } from "node:fs";
import { generateMeta, type ProductData } from "@acme/lib/generateMeta";

// CLI usage: tsx scripts/generate-meta.ts path/to/product.json
if (process.argv[1] && process.argv[1].endsWith("generate-meta.ts")) {
  (async () => {
    const input = process.argv[2];
    if (!input) {
      console.error("Usage: generate-meta.ts <product.json>");
      process.exit(1);
    }
    const raw = await fs.readFile(input, "utf8");
    const product = JSON.parse(raw) as ProductData;
    const result = await generateMeta(product);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
  })();
}
