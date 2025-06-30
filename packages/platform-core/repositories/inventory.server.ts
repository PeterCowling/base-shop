// packages/platform-core/repositories/inventory.server.ts

import "server-only";

import type { InventoryItem } from "@types";
import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();

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
    return JSON.parse(buf) as InventoryItem[];
  } catch {
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
