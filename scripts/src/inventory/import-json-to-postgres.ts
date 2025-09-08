import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@acme/platform-core/db";
import { variantKey } from "@acme/platform-core/types/inventory";

async function importShop(shopId: string, dryRun: boolean): Promise<void> {
  const db = prisma as any;
  const filePath = join("data", "shops", shopId, "inventory.json");
  try {
    await stat(filePath);
  } catch {
    return; // no inventory file
  }
  const raw = await readFile(filePath, "utf8");
  const items: any[] = JSON.parse(raw);
  const keep = new Set<string>();

  for (const item of items) {
    const variantAttributes = item.variantAttributes || item.variant || {};
    const key = variantKey(item.sku, variantAttributes);
    keep.add(key);
    const data = {
      shopId,
      sku: item.sku,
      productId: item.productId,
      quantity: item.quantity,
      variantAttributes,
      lowStockThreshold: item.lowStockThreshold,
      wearCount: item.wearCount,
      wearAndTearLimit: item.wearAndTearLimit,
      maintenanceCycle: item.maintenanceCycle,
      variantKey: key,
    };

    const existing = await db.inventoryItem.findUnique({
      where: {
        shopId_sku_variantKey: { shopId, sku: item.sku, variantKey: key },
      },
    });
    const same =
      existing &&
      existing.productId === data.productId &&
      existing.quantity === data.quantity &&
      existing.lowStockThreshold === data.lowStockThreshold &&
      existing.wearCount === data.wearCount &&
      existing.wearAndTearLimit === data.wearAndTearLimit &&
      existing.maintenanceCycle === data.maintenanceCycle &&
      JSON.stringify(existing.variantAttributes) ===
        JSON.stringify(data.variantAttributes);
    if (same) continue;
    if (dryRun) {
      console.log(`[dry-run] upsert ${shopId} ${key}`);
    } else {
      await db.inventoryItem.upsert({
        where: {
          shopId_sku_variantKey: { shopId, sku: item.sku, variantKey: key },
        },
        create: data,
        update: data,
      });
    }
  }

  const existingItems = await db.inventoryItem.findMany({
    where: { shopId },
  });
  for (const ex of existingItems) {
    if (!keep.has(ex.variantKey)) {
      if (dryRun) {
        console.log(`[dry-run] delete ${shopId} ${ex.variantKey}`);
      } else {
        await db.inventoryItem.delete({ where: { id: ex.id } });
      }
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      shop: { type: "string" },
    },
  });
  const dryRun = Boolean(values["dry-run"]);
  const root = join("data", "shops");
  const shops = values.shop ? [values.shop] : await readdir(root);
  for (const shop of shops) {
    await importShop(shop, dryRun);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
