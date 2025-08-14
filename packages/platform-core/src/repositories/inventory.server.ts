// packages-platform-core/repositories/inventory.server.ts

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

function inventoryDir(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory");
}

function itemPath(
  shop: string,
  sku: string,
  attrs: Record<string, string>,
): string {
  return path.join(
    inventoryDir(shop),
    `${encodeURIComponent(variantKey(sku, attrs))}.json`,
  );
}

async function readInventoryDir(shop: string): Promise<InventoryItem[]> {
  const dir = inventoryDir(shop);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`Failed to read inventory dir for ${shop}`, err);
    throw err;
  }
  const items: InventoryItem[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const buf = await fs.readFile(path.join(dir, file), "utf8");
      const raw = JSON.parse(buf);
      items.push(
        inventoryItemSchema.parse({ variantAttributes: {}, ...raw }),
      );
    } catch (err) {
      console.error(`Failed to read inventory item ${file} for ${shop}`, err);
      throw err;
    }
  }
  return items;
}

async function writeItem(
  shop: string,
  item: InventoryItem,
): Promise<void> {
  const normalized = inventoryItemSchema.parse({
    ...item,
    variantAttributes: { ...item.variantAttributes },
  });
  const p = itemPath(shop, normalized.sku, normalized.variantAttributes);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const lockFile = `${p}.lock`;
  const handle = await acquireLock(lockFile);
  try {
    const tmp = `${p}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
    await fs.rename(tmp, p);
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }
}

export async function readInventory(shop: string): Promise<InventoryItem[]> {
  if (process.env.INVENTORY_BACKEND === "sqlite") {
    const mod = await import("./inventory.sqlite.server");
    return mod.readInventory(shop);
  }
  return readInventoryDir(shop);
}

export async function writeInventory(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  if (process.env.INVENTORY_BACKEND === "sqlite") {
    const mod = await import("./inventory.sqlite.server");
    return mod.writeInventory(shop, items);
  }
  await Promise.all(items.map((i) => writeItem(shop, i)));
  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      const all = await readInventory(shop);
      await checkAndAlert(shop, all);
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }
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

/**
 * Atomically update a single inventory variant using a per-item file.
 *
 * The `mutate` callback receives the current item (if any) and should return
 * the updated item. Returning `undefined` will remove the item.
 */
export async function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: (current: InventoryItem | undefined) => InventoryItem | undefined,
): Promise<InventoryItem | undefined> {
  if (process.env.INVENTORY_BACKEND === "sqlite") {
    const mod = await import("./inventory.sqlite.server");
    return (mod as any).updateInventoryItem(
      shop,
      sku,
      variantAttributes,
      mutate,
    );
  }

  const p = itemPath(shop, sku, variantAttributes);
  await fs.mkdir(path.dirname(p), { recursive: true });
  const lockFile = `${p}.lock`;
  const handle = await acquireLock(lockFile);
  let updated: InventoryItem | undefined;
  try {
    let current: InventoryItem | undefined;
    try {
      const buf = await fs.readFile(p, "utf8");
      const raw = JSON.parse(buf);
      current = inventoryItemSchema.parse({ variantAttributes: {}, ...raw });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    updated = mutate(current);
    if (updated === undefined) {
      await fs.unlink(p).catch(() => {});
    } else {
      const nextItem = inventoryItemSchema.parse({
        ...current,
        ...updated,
        sku,
        variantAttributes,
      });
      const tmp = `${p}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(nextItem, null, 2), "utf8");
      await fs.rename(tmp, p);
    }
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }

  try {
    if (process.env.SKIP_STOCK_ALERT !== "1" && updated) {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, [updated]);
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }

  return updated;
}
