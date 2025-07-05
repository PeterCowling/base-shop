// packages/platform-core/repositories/inventory.server.ts

import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";

import { DATA_ROOT } from "./utils";

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
    const parsed = inventoryItemSchema.array().safeParse(JSON.parse(buf));
    return parsed.success ? parsed.data : [];
  } catch (err) {
    return [];
  }
}

export async function writeInventory(
  shop: string,
  items: InventoryItem[]
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), "utf8");
  await fs.rename(tmp, inventoryPath(shop));
}
