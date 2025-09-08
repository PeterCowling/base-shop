// packages/platform-core/repositories/shops.server.ts
import "server-only";

import type { Shop } from "@acme/types";
import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

export {
  diffHistory,
  getShopSettings,
  saveShopSettings,
  type SettingsDiffEntry,
} from "./settings.server";

interface ShopsModule {
  applyThemeData(data: Shop): Promise<Shop>;
  readShop(shop: string): Promise<Shop>;
  writeShop(shop: string, patch: Partial<Shop> & { id: string }): Promise<Shop>;
}

let repoPromise: Promise<ShopsModule> | undefined;

async function getRepo(): Promise<ShopsModule> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ShopsModule>(
      () => prisma.shop,
      () => import("./shops.prisma.server"),
      () => import("./shops.json.server"),
    );
  }
  return repoPromise;
}

export async function applyThemeData(data: Shop): Promise<Shop> {
  const repo = await getRepo();
  return repo.applyThemeData(data);
}

export async function readShop(shop: string): Promise<Shop> {
  const repo = await getRepo();
  return repo.readShop(shop);
}

export async function writeShop(
  shop: string,
  patch: Partial<Shop> & { id: string },
): Promise<Shop> {
  const repo = await getRepo();
  return repo.writeShop(shop, patch);
}
