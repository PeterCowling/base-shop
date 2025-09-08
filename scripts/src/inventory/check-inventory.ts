// scripts/src/inventory/check-inventory.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@acme/platform-core/db";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      shop: { type: "string" },
    },
  });
  const shopId = values.shop;
  if (!shopId) {
    console.error("Missing required --shop argument");
    process.exit(1);
  }

  const filePath = join("data", "shops", shopId, "inventory.json");
  const raw = await readFile(filePath, "utf8");
  const jsonItems = JSON.parse(raw) as unknown[];
  const jsonCount = jsonItems.length;

  const dbCount = await prisma.inventoryItem.count({ where: { shopId } });

  if (jsonCount !== dbCount) {
    console.log(`[${shopId}] count mismatch: file=${jsonCount} db=${dbCount}`);
    process.exit(1);
  }

  console.log(`[${shopId}] inventory counts match (${jsonCount})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
