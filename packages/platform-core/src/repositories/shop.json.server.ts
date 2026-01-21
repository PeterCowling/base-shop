import "server-only";

import { type Shop,shopSchema } from "@acme/types";

import { ensureShopDir, readFromShop, renameInShop,writeToShop } from "../utils/safeFs";

// shop path is resolved via safeFs helpers

async function ensureDir(shop: string): Promise<void> {
  await ensureShopDir(shop);
}

export async function getShopById<T extends Shop>(shop: string): Promise<T> {
  try {
    const buf = (await readFromShop(shop, "shop.json", "utf8")) as string;
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
  const tmp = `shop.json.${Date.now()}.tmp`;
  await writeToShop(shop, tmp, JSON.stringify(updated, null, 2), "utf8");
  await renameInShop(shop, tmp, "shop.json");
  return updated;
}

export const jsonShopRepository = {
  getShopById,
  updateShopInRepo,
};

export { getShopById as getShopJson };
