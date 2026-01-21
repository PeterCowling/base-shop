import "server-only";

import { type Shop,shopSchema } from "@acme/types";

import { prisma } from "../db";

export async function getShopById<T extends Shop>(shop: string): Promise<T> {
  const rec = await prisma.shop.findUnique({ where: { id: shop } });
  if (!rec) {
    throw new Error(`Shop ${shop} not found`);
  }
  const parsed = shopSchema.parse(rec.data);
  return parsed as T;
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
  await prisma.shop.upsert({
    where: { id: shop },
    create: { id: shop, data: updated },
    update: { data: updated },
  });
  return updated;
}

export const prismaShopRepository = {
  getShopById,
  updateShopInRepo,
};

