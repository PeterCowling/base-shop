// packages/platform-core/repositories/inventory.server.ts

import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@acme/types";
// InventoryItem uses flexible variantAttributes for SKU differentiation
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";

import { DATA_ROOT } from "../dataRoot";

function inventoryPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readInventory(shop: string): Promise<InventoryItem[]> {
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

export async function writeInventory(
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
  const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(tmp, inventoryPath(shop));
  try {
    const { checkAndAlert } = await import("../services/stockAlert.server");
    await checkAndAlert(shop, normalized);
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

const shopLocks = new Map<string, Promise<void>>();

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const defined = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
  return { ...base, ...defined } as T;
}

async function withLock<T>(shop: string, fn: () => Promise<T>): Promise<T> {
  shop = validateShopName(shop);
  const prev = shopLocks.get(shop) ?? Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((resolve) => (release = resolve));
  shopLocks.set(shop, prev.then(() => next));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (shopLocks.get(shop) === next) shopLocks.delete(shop);
  }
}

export async function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  patch: Partial<Omit<InventoryItem, "sku" | "variantAttributes"> & { productId: string }>
): Promise<InventoryItem> {
  return withLock(shop, async () => {
    let items: InventoryItem[];
    try {
      items = await readInventory(shop);
    } catch {
      items = [];
    }
    const key = variantKey(sku, variantAttributes);
    const idx = items.findIndex(
      (i) => variantKey(i.sku, i.variantAttributes) === key
    );
    let item: InventoryItem;
    if (idx === -1) {
      if (patch.productId === undefined || patch.quantity === undefined) {
        throw new Error(`Inventory item ${key} not found in ${shop}`);
      }
      item = inventoryItemSchema.parse({
        sku,
        productId: patch.productId,
        quantity: patch.quantity,
        variantAttributes,
        ...(patch.lowStockThreshold !== undefined
          ? { lowStockThreshold: patch.lowStockThreshold }
          : {}),
      });
      items.push(item);
    } else {
      const current = items[idx];
      const updated = mergeDefined(current, patch);
      item = inventoryItemSchema.parse({
        ...updated,
        sku,
        variantAttributes: { ...variantAttributes },
      });
      items[idx] = item;
    }
    await writeInventory(shop, items);
    return item;
  });
}
