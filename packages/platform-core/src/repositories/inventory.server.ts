import "server-only";

import { prisma } from "../db";
import {
  type InventoryItem,
  inventoryItemSchema,
  variantKey,
} from "../types/inventory";

import type { InventoryMutateFn,InventoryRepository } from "./inventory.types";
import { resolveRepo } from "./repoResolver";

export type InventoryRepositoryBackend = "prisma" | "json";

type InventoryRepositoryOptions = {
  backend?: InventoryRepositoryBackend;
};

const repoPromises = new Map<string, Promise<InventoryRepository>>();

function getPrismaInventoryDelegate(): unknown | undefined {
  return (prisma as { inventoryItem?: unknown }).inventoryItem;
}

function assertPrismaInventoryBackend(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Prisma inventory backend requested but DATABASE_URL is not set.',
    );
  }
  if (!getPrismaInventoryDelegate()) {
    throw new Error(
      "Prisma inventory backend requested but Prisma inventory delegate is unavailable.",
    );
  }
}

async function loadRepo(
  backend?: InventoryRepositoryBackend,
): Promise<InventoryRepository> {
  if (backend === "json") {
    return await import("./inventory.json.server").then(
      (m) => m.jsonInventoryRepository,
    );
  }

  if (backend === "prisma") {
    assertPrismaInventoryBackend();
    return await import("./inventory.prisma.server").then(
      (m) => m.prismaInventoryRepository,
    );
  }

  return await resolveRepo(
    getPrismaInventoryDelegate,
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

async function getRepo(
  options: InventoryRepositoryOptions = {},
): Promise<InventoryRepository> {
  const cacheKey = options.backend ?? "auto";
  let repoPromise = repoPromises.get(cacheKey);
  if (!repoPromise) {
    repoPromise = loadRepo(options.backend);
    repoPromises.set(cacheKey, repoPromise);
  }
  return await repoPromise;
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
  options: InventoryRepositoryOptions = {},
): Promise<Record<string, InventoryItem>> {
  let items = await readInventory(shop, options);
  if (!Array.isArray(items)) {
    const { jsonInventoryRepository } = await import("./inventory.json.server");
    items = await jsonInventoryRepository.read(shop);
  }
  return Object.fromEntries(
    items.map((i: InventoryItem) => [variantKey(i.sku, i.variantAttributes), i]),
  );
}

export async function readInventory(
  shop: string,
  options: InventoryRepositoryOptions = {},
) {
  const repo = await getRepo(options);
  return repo.read(shop);
}

export async function writeInventory(
  shop: string,
  items: InventoryItem[],
  options: InventoryRepositoryOptions = {},
) {
  const repo = await getRepo(options);
  const parsed = inventoryItemSchema.array().parse(items);
  return repo.write(shop, parsed);
}

export async function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
  options: InventoryRepositoryOptions = {},
) {
  const repo = await getRepo(options);
  return repo.update(shop, sku, variantAttributes, mutate);
}

export { variantKey };
export type { InventoryItem };
