import "server-only";

import type { Shop } from "@acme/types";

import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

type ShopRepo = {
  getShopById<T extends Shop>(shop: string): Promise<T>;
  updateShopInRepo<T extends Shop>(
    shop: string,
    patch: Partial<T> & { id: string },
  ): Promise<T>;
};

let repoPromise: Promise<ShopRepo> | undefined;

async function getRepo(): Promise<ShopRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ShopRepo>(
      () => (prisma as any).shop,
      () => import("./shop.prisma.server"),
      () => import("./shop.json.server"),
      { backendEnvVar: "SHOP_BACKEND" },
    );
  }
  return repoPromise;
}

export async function getShopById<T extends Shop>(
  shop: string,
): Promise<T> {
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

