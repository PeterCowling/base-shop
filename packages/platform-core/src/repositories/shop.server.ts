// packages/platform-core/src/repositories/shop.server.ts
import "server-only";

import type { Shop } from "@acme/types";
import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

let repoPromise:
  | Promise<typeof import("./shop.prisma.server")>
  | undefined;

async function getRepo(): Promise<typeof import("./shop.prisma.server")> {
  if (!repoPromise) {
    repoPromise = resolveRepo(
      () => (prisma as any).shop,
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

