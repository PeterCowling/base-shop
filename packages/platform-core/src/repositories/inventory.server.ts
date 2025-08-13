// packages/platform-core/repositories/inventory.server.ts

import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@acme/types";
// InventoryItem uses flexible variantAttributes for SKU differentiation
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";

import { DATA_ROOT } from "../dataRoot";

async function acquireLock(lockFile: string): Promise<fs.FileHandle> {
  while (true) {
    try {
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      await new Promise((res) => setTimeout(res, 50));
    }
  }
}

function inventoryPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function readInventoryFile(shop: string): Promise<InventoryItem[]> {
  try {
    const buf = await fs.readFile(inventoryPath(shop), "utf8");
    const raw = JSON.parse(buf);
    // Ensure variantAttributes is always a plain object
    return inventoryItemSchema
      .array()
      .parse(
        raw.map((i: any) => ({
          variantAttributes: {},
          ...i,
        })),
      );
  } catch (err) {
    console.error(`Failed to read inventory for ${shop}`, err);
    throw err;
  }
}

async function writeInventoryFile(
  shop: string,
  items: InventoryItem[]
): Promise<void> {
  const normalized = inventoryItemSchema
    .array()
    .parse(
      items.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
      })),
    );
  await ensureDir(shop);
  const lockFile = `${inventoryPath(shop)}.lock`;
  const handle = await acquireLock(lockFile);
  try {
    const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
    await fs.rename(tmp, inventoryPath(shop));
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }
  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, normalized);
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }
}

export async function readInventory(shop: string): Promise<InventoryItem[]> {
  if (process.env.INVENTORY_BACKEND === "sqlite") {
    const mod = await import("./inventory.sqlite.server");
    return mod.readInventory(shop);
  }
  return readInventoryFile(shop);
}

export async function writeInventory(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  if (process.env.INVENTORY_BACKEND === "sqlite") {
    const mod = await import("./inventory.sqlite.server");
    return mod.writeInventory(shop, items);
  }
  return writeInventoryFile(shop, items);
}

/** Create a unique key for a SKU + variant attribute combination */
export function variantKey(
  sku: string,
  attrs: Record<string, string>,
): string {
  const variantPart = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return variantPart ? `${sku}#${variantPart}` : sku;
}

/**
 * Map inventory records by SKU and variant attributes, enabling quick lookup
 * of stock entries for specific product variants.
 */
export async function readInventoryMap(
  shop: string,
): Promise<Record<string, InventoryItem>> {
  const items = await readInventory(shop);
  return Object.fromEntries(
    items.map((i) => [variantKey(i.sku, i.variantAttributes), i]),
  );
}
