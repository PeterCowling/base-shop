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
