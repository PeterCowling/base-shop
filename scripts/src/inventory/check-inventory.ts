// scripts/src/inventory/check-inventory.ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import { prisma } from "@acme/platform-core/db";
import { variantKey } from "@acme/platform-core/types/inventory";
import type { InventoryItem as DbInventoryItem } from "@prisma/client";

interface JsonItem {
  sku: string;
  productId: string;
  quantity: number;
  variant?: Record<string, string>;
  variantAttributes?: Record<string, string>;
  lowStockThreshold?: number;
  wearCount?: number;
  wearAndTearLimit?: number;
  maintenanceCycle?: number;
}

async function checkShop(shopId: string): Promise<boolean> {
  const db = prisma;
  const filePath = join("data", "shops", shopId, "inventory.json");
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch {
    return false; // no inventory file
  }
  const items: JsonItem[] = JSON.parse(raw);
  const jsonMap = new Map<string, JsonItem & { variantKey: string; variantAttributes: Record<string, string> }>();
  for (const item of items) {
    const variantAttributes = item.variantAttributes || item.variant || {};
    const vk = variantKey(item.sku, variantAttributes);
    jsonMap.set(`${item.sku}|${vk}`, { ...item, variantKey: vk, variantAttributes });
  }

  const dbItems = await db.inventoryItem.findMany({ where: { shopId } });
  const dbMap = new Map<string, DbInventoryItem>();
  for (const item of dbItems) {
    dbMap.set(`${item.sku}|${item.variantKey}`, item);
  }

  let hasDiscrepancy = false;
  if (items.length !== dbItems.length) {
    console.log(`[${shopId}] count mismatch: file=${items.length} db=${dbItems.length}`);
    hasDiscrepancy = true;
  }

  for (const [key, item] of jsonMap.entries()) {
    const dbItem = dbMap.get(key);
    if (!dbItem) {
      console.log(`[${shopId}] missing in DB: ${item.sku} ${item.variantKey}`);
      hasDiscrepancy = true;
      continue;
    }
    const same =
      dbItem.productId === item.productId &&
      dbItem.quantity === item.quantity &&
      dbItem.lowStockThreshold === item.lowStockThreshold &&
      dbItem.wearCount === item.wearCount &&
      dbItem.wearAndTearLimit === item.wearAndTearLimit &&
      dbItem.maintenanceCycle === item.maintenanceCycle &&
      JSON.stringify(dbItem.variantAttributes) === JSON.stringify(item.variantAttributes);
    if (!same) {
      console.log(`[${shopId}] mismatched entry: ${item.sku} ${item.variantKey}`);
      hasDiscrepancy = true;
    }
  }

  for (const [key, item] of dbMap.entries()) {
    if (!jsonMap.has(key)) {
      console.log(`[${shopId}] extra in DB: ${item.sku} ${item.variantKey}`);
      hasDiscrepancy = true;
    }
  }

  return hasDiscrepancy;
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
  let hasDiscrepancy = false;
  for (const shop of shops) {
    const discrep = await checkShop(shop);
    hasDiscrepancy ||= discrep;
  }
  if (hasDiscrepancy && !dryRun) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
