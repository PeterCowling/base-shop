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
  const shop = values.shop;
  if (!shop) {
    console.error(
      "Usage: pnpm tsx scripts/src/inventory/check-inventory.ts --shop <shop>"
    );
    process.exit(1);
  }

  const jsonPath = join("data", "shops", shop, "inventory.json");
  let jsonCount = 0;
  try {
    const raw = await readFile(jsonPath, "utf8");
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) {
      throw new Error("inventory.json does not contain an array");
    }
    jsonCount = items.length;
  } catch (err) {
    console.error(`Failed to read ${jsonPath}:`, err);
    process.exit(1);
  }

  const db = prisma as {
    inventoryItem: {
      findMany: (args: { where: { shopId: string } }) => Promise<unknown[]>;
    };
  };
  const dbItems = await db.inventoryItem.findMany({ where: { shopId: shop } });
  const dbCount = dbItems.length;

  console.log(`JSON count: ${jsonCount}`);
  console.log(`DB count: ${dbCount}`);
  if (jsonCount === dbCount) {
    console.log("Counts match.");
  } else {
    console.log("Counts differ.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
