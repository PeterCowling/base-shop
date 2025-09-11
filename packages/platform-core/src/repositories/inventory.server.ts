import "server-only";

import {
  inventoryItemSchema,
  type InventoryItem,
  variantKey,
} from "../types/inventory";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";
import { createRequire } from "module";
import { resolveRepo } from "./repoResolver";

let repoPromise: Promise<InventoryRepository> | undefined;

async function getRepo(): Promise<InventoryRepository> {
  if (!repoPromise) {
    const moduleUrl =
      typeof __filename !== "undefined"
        ? __filename
        : (Function("return import.meta.url")() as string);
    const require = createRequire(moduleUrl);
    repoPromise = resolveRepo(
      () => {
        // Skip Prisma if obviously invalid secrets are present
        if (
          (process.env.NEXTAUTH_SECRET &&
            process.env.NEXTAUTH_SECRET.length < 32) ||
          (process.env.SESSION_SECRET &&
            process.env.SESSION_SECRET.length < 32)
        ) {
          return undefined;
        }
        try {
          return require("../db").prisma.inventoryItem;
        } catch {
          return undefined;
        }
      },
      () =>
        import("./inventory.prisma.server").then(
          (m) => m.prismaInventoryRepository,
        ),
      () =>
        import("./inventory.json.server").then(
          (m) => m.jsonInventoryRepository,
        ),
      { backendEnvVar: "INVENTORY_BACKEND" },
    );
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
