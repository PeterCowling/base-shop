import "server-only";

import { prisma } from "../db";
import type { ProductPublication } from "../products/index";

import { jsonProductsRepository } from "./products.json.server";
import type { ProductsRepository } from "./products.types";

function toProduct(record: unknown): ProductPublication {
  return record as ProductPublication;
}

async function read<T = ProductPublication>(shop: string): Promise<T[]> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.read<T>(shop);
  }
  try {
    const rows = await db.product.findMany({ where: { shopId: shop } });
    return rows.map(toProduct) as unknown as T[];
  } catch (err) {
    console.error(`Failed to read products for ${shop}`, err);
    return jsonProductsRepository.read<T>(shop);
  }
}

async function getById<T extends { id: string } = ProductPublication>(
  shop: string,
  id: string,
): Promise<T | null> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.getById<T>(shop, id);
  }
  try {
    const row = await db.product.findUnique({
      where: { shopId_id: { shopId: shop, id } },
    });
    return row ? (toProduct(row) as unknown as T) : null;
  } catch (err) {
    console.error(`Failed to get product ${id} for ${shop}`, err);
    return jsonProductsRepository.getById<T>(shop, id);
  }
}

export const prismaProductsRepository: ProductsRepository = {
  read,
  write: jsonProductsRepository.write,
  getById,
  update: jsonProductsRepository.update,
  delete: jsonProductsRepository.delete,
  duplicate: jsonProductsRepository.duplicate,
};
