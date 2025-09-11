import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import { shopSchema, type Shop } from "@acme/types";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";

function shopPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "shop.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function getShopById<T extends Shop>(shop: string): Promise<T> {
  try {
    const buf = await fs.readFile(shopPath(shop), "utf8");
    const data = JSON.parse(buf);
    const parsed = shopSchema.parse(data);
    return parsed as T;
  } catch {
    throw new Error(`Shop ${shop} not found`);
  }
}

export async function updateShopInRepo<T extends Shop>(
  shop: string,
  patch: Partial<T> & { id: string },
): Promise<T> {
  const current = await getShopById<T>(shop);
  if (current.id !== patch.id) {
    throw new Error(`Shop ${patch.id} not found in ${shop}`);
  }
  const updated = shopSchema.parse({ ...current, ...patch }) as T;
  await ensureDir(shop);
  const tmp = `${shopPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(updated, null, 2), "utf8");
  await fs.rename(tmp, shopPath(shop));
  return updated;
}

export const jsonShopRepository = {
  getShopById,
  updateShopInRepo,
};

export { getShopById as getShopJson };

