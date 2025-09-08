import "server-only";

import type { Shop } from "@acme/types";
import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

interface ShopModule {
  getShopById<T extends Shop>(shop: string): Promise<T>;
  updateShopInRepo<T extends Shop>(
    shop: string,
    patch: Partial<T> & { id: string },
  ): Promise<T>;
}

let repoPromise: Promise<ShopModule> | undefined;

async function getRepo(): Promise<ShopModule> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ShopModule>(
      () => prisma.shop,
      () => import("./shop.prisma.server"),
      () => import("./shop.json.server"),
    );
  }
  return repoPromise;
}

export async function getShopById<T extends Shop>(shop: string): Promise<T> {
  const repo = await getRepo();
  return repo.getShopById<T>(shop);
}

export async function updateShopInRepo<T extends Shop>(
  shop: string,
  patch: Partial<T> & { id: string },
): Promise<T> {
  const repo = await getRepo();
  return repo.updateShopInRepo<T>(shop, patch);
}
