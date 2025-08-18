import "server-only";

import type { InventoryItem } from "@acme/types";
import type {
  InventoryRepository,
  InventoryMutateFn,
} from "./inventory.types.js";

let repoPromise: Promise<InventoryRepository> | undefined;

async function getRepo(): Promise<InventoryRepository> {
  if (!repoPromise) {
    repoPromise = (async () => {
      if (process.env.INVENTORY_BACKEND === "sqlite") {
        const mod = await import("./inventory.sqlite.server.js");
        return mod.sqliteInventoryRepository;
      }
      const mod = await import("./inventory.json.server.js");
      return mod.jsonInventoryRepository;
    })();
  }
  return repoPromise;
}

export const inventoryRepository: InventoryRepository = {
  async read(shop: string) {
    const repo = await getRepo();
    return repo.read(shop);
  },
  async write(shop: string, items: InventoryItem[]) {
    const repo = await getRepo();
    return repo.write(shop, items);
  },
  async update(
    shop: string,
    sku: string,
    variantAttributes: Record<string, string>,
    mutate: InventoryMutateFn,
  ) {
    const repo = await getRepo();
    return repo.update(shop, sku, variantAttributes, mutate);
  },
};

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

export async function readInventoryMap(
  shop: string,
): Promise<Record<string, InventoryItem>> {
  const items = await inventoryRepository.read(shop);
  return Object.fromEntries(
    items.map((i) => [variantKey(i.sku, i.variantAttributes), i]),
  );
}

export function readInventory(shop: string) {
  return inventoryRepository.read(shop);
}

export function writeInventory(shop: string, items: InventoryItem[]) {
  return inventoryRepository.write(shop, items);
}

export function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
) {
  return inventoryRepository.update(shop, sku, variantAttributes, mutate);
}
