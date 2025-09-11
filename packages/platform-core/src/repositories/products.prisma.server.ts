import "server-only";

import type { ProductPublication } from "../products/index";
import { prisma } from "../db";
import type { ProductsRepository } from "./products.types";
import { jsonProductsRepository } from "./products.json.server";

async function getById<
  T extends { id: string } = ProductPublication,
>(shop: string, id: string): Promise<T | null> {
  const product = await (prisma as any).product?.findFirst({
    where: { shop, id },
  });
  return (product ?? null) as T | null;
}

export const prismaProductsRepository: ProductsRepository = {
  ...jsonProductsRepository,
  getById,
};
