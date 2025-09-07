import "server-only";

import {
  inventoryItemSchema,
  type InventoryItem,
  variantKey,
} from "../types/inventory";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

let repoPromise: Promise<InventoryRepository> | undefined;

async function getRepo(): Promise<InventoryRepository> {
  if (!repoPromise) {
    const backend = process.env.INVENTORY_BACKEND;
    if (backend === "sqlite") {
      repoPromise = Promise.resolve(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        (require("./inventory." + "sqlite.server") as any)
          .sqliteInventoryRepository,
      );
    } else if (backend === "json") {
      repoPromise = import("./inventory.json.server").then(
        (m) => m.jsonInventoryRepository,
      );
    } else {
      repoPromise = import("./inventory.prisma.server").then(
        (m) => m.prismaInventoryRepository,
      );
    }
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
    const parsed = inventoryItemSchema.array().parse(items);
    return repo.write(shop, parsed);
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

export async function readInventoryMap(
  shop: string,
): Promise<Record<string, InventoryItem>> {
  const items = await inventoryRepository.read(shop);
  return Object.fromEntries(
    items.map((i: InventoryItem) => [variantKey(i.sku, i.variantAttributes), i]),
  );
}

export function readInventory(shop: string) {
  return inventoryRepository.read(shop);
}

export function writeInventory(shop: string, items: InventoryItem[]) {
  const parsed = inventoryItemSchema.array().parse(items);
  return inventoryRepository.write(shop, parsed);
}

export function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
) {
  return inventoryRepository.update(shop, sku, variantAttributes, mutate);
}

export { variantKey };
export type { InventoryItem };
