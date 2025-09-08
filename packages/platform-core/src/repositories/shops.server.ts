// packages-platform-core/src/repositories/shops.server.ts
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

let repoPromise:
  | Promise<typeof import("./shops.prisma.server")>
  | undefined;

async function getRepo(): Promise<typeof import("./shops.prisma.server")> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => (prisma as any).shop,
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

