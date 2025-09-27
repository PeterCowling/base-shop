import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";

import { prisma } from "../src/db";
import { nowIso } from "@acme/date-utils";
import { variantKey } from "../src/types/inventory";

const skipInventory = process.argv.includes("--skip-inventory");

async function main() {
  await prisma.rentalOrder.createMany({
    data: [
      {
        id: "seed-order-1",
        shop: "seed-shop",
        sessionId: "seed-session",
        deposit: 0,
        startedAt: nowIso(),
      },
    ],
    skipDuplicates: true,
  });

  if (!skipInventory) {
    const shopsDir = path.resolve(__dirname, "../../../data/shops");
    const dirs = await readdir(shopsDir, { withFileTypes: true });
    const data: Prisma.InventoryItemCreateManyInput[] = [];

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;
      const shop = dir.name;
      const file = path.join(shopsDir, shop, "inventory.json");
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-123: reading controlled seed data files under data/shops
        const raw = await readFile(file, "utf8");
        const items = JSON.parse(raw) as Array<{
          sku: string;
          productId: string;
          quantity: number;
          variant?: Record<string, string>;
          lowStockThreshold?: number;
          wearCount?: number;
          wearAndTearLimit?: number;
          maintenanceCycle?: number;
        }>;

        for (const item of items) {
          const attrs = item.variant ?? {};
          data.push({
            id: `${shop}-${item.sku}`,
            shopId: shop,
            sku: item.sku,
            productId: item.productId,
            quantity: item.quantity,
            variantAttributes: attrs,
            variantKey: variantKey(item.sku, attrs),
            lowStockThreshold: item.lowStockThreshold,
            wearCount: item.wearCount,
            wearAndTearLimit: item.wearAndTearLimit,
            maintenanceCycle: item.maintenanceCycle,
          });
        }
      } catch {
        // Missing inventory file; skip
      }
    }

    if (data.length) {
      await prisma.inventoryItem.createMany({ data, skipDuplicates: true });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
