// scripts/src/seed-sample-shop.ts
// Seed a sample shop using the sample-rental template.

import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { validateShopName } from "@acme/lib";

import { seedShop } from "./seedShop";

function parseArgs(argv: string[]): { shop: string } {
  let shop = "sample-rental";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--shop" && argv[i + 1]) {
      shop = argv[i + 1];
      i++;
    } else if (arg.startsWith("--shop=")) {
      shop = arg.slice("--shop=".length);
    }
  }
  return { shop };
}

async function main(): Promise<void> {
  const { shop } = parseArgs(process.argv.slice(2));
  const safeShop = validateShopName(shop);
  const destDir = join("data", "shops", safeShop);
   
  mkdirSync(destDir, { recursive: true });
  seedShop(safeShop, "sample-rental", true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
