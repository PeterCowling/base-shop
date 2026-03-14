import "server-only";

import type { Prisma } from "@prisma/client";
import { ulid } from "ulid";

import { prisma } from "../db";
import type { ProductPublication } from "../products/index";

import { jsonProductsRepository } from "./products.json.server";
import type { ProductsRepository } from "./products.types";

type Inp = Prisma.InputJsonValue;

function toProduct(record: unknown): ProductPublication {
  return record as ProductPublication;
}

/** Map a ProductPublication into the Prisma create/upsert data shape. */
function toCreateData(
  shopId: string,
  p: ProductPublication,
  now: Date,
) {
  return {
    id: p.id,
    shopId,
    sku: p.sku,
    title: p.title as unknown as Inp,
    description: p.description as unknown as Inp,
    media: p.media as unknown as Inp,
    price: p.price,
    currency: p.currency,
    status: p.status,
    row_version: p.row_version ?? 1,
    forSale: p.forSale ?? true,
    forRental: p.forRental ?? false,
    deposit: p.deposit ?? 0,
    rentalTerms: p.rentalTerms ?? null,
    dailyRate: p.dailyRate ?? null,
    weeklyRate: p.weeklyRate ?? null,
    monthlyRate: p.monthlyRate ?? null,
    wearAndTearLimit: p.wearAndTearLimit ?? null,
    maintenanceCycle: p.maintenanceCycle ?? null,
    availability: (p.availability ?? undefined) as Inp | undefined,
    materials: (p.materials ?? undefined) as Inp | undefined,
    dimensions: (p.dimensions ?? undefined) as Inp | undefined,
    weight: (p.weight ?? undefined) as Inp | undefined,
    publishShops: (p.publishShops ?? undefined) as Inp | undefined,
    createdAt: p.created_at ? new Date(p.created_at) : now,
    updatedAt: p.updated_at ? new Date(p.updated_at) : now,
  };
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

async function write<T = ProductPublication>(
  shop: string,
  catalogue: T[],
): Promise<void> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.write(shop, catalogue);
  }
  const now = new Date();
  for (const item of catalogue) {
    const p = item as unknown as ProductPublication;
    const data = toCreateData(shop, p, now);
    await db.product.upsert({
      where: { shopId_sku: { shopId: shop, sku: p.sku } },
      create: data,
      update: {
        title: data.title,
        description: data.description,
        media: data.media,
        price: data.price,
        currency: data.currency,
        status: data.status,
        row_version: data.row_version,
        forSale: data.forSale,
        forRental: data.forRental,
        deposit: data.deposit,
        rentalTerms: data.rentalTerms,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        wearAndTearLimit: data.wearAndTearLimit,
        maintenanceCycle: data.maintenanceCycle,
        availability: data.availability,
        materials: data.materials,
        dimensions: data.dimensions,
        weight: data.weight,
        publishShops: data.publishShops,
        updatedAt: now,
      },
    });
  }
}

async function create<T extends ProductPublication = ProductPublication>(
  shop: string,
  product: T,
): Promise<T> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.create(shop, product);
  }
  try {
    const now = new Date();
    const data = toCreateData(shop, product as unknown as ProductPublication, now);
    const created = await db.product.create({ data });
    return toProduct(created) as unknown as T;
  } catch (err) {
    console.error(`Failed to create product ${product.id} for ${shop}`, err);
    return jsonProductsRepository.create(shop, product);
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

async function update<
  T extends { id: string; row_version: number } = ProductPublication,
>(shop: string, patch: Partial<T> & { id: string }): Promise<T> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.update(shop, patch);
  }
  try {
    const p = patch as unknown as Partial<ProductPublication> & { id: string };
    // Build data object with only provided fields; always increment row_version.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = { row_version: { increment: 1 }, updatedAt: new Date() };
    if (p.title !== undefined) data.title = p.title as Inp;
    if (p.description !== undefined) data.description = p.description as Inp;
    if (p.media !== undefined) data.media = p.media as unknown as Inp;
    if (p.price !== undefined) data.price = p.price;
    if (p.currency !== undefined) data.currency = p.currency;
    if (p.status !== undefined) data.status = p.status;
    if (p.forSale !== undefined) data.forSale = p.forSale;
    if (p.forRental !== undefined) data.forRental = p.forRental;
    if (p.deposit !== undefined) data.deposit = p.deposit;
    if (p.rentalTerms !== undefined) data.rentalTerms = p.rentalTerms;
    if (p.dailyRate !== undefined) data.dailyRate = p.dailyRate;
    if (p.weeklyRate !== undefined) data.weeklyRate = p.weeklyRate;
    if (p.monthlyRate !== undefined) data.monthlyRate = p.monthlyRate;
    if (p.wearAndTearLimit !== undefined) data.wearAndTearLimit = p.wearAndTearLimit;
    if (p.maintenanceCycle !== undefined) data.maintenanceCycle = p.maintenanceCycle;
    if (p.availability !== undefined) data.availability = p.availability as Inp;
    if (p.materials !== undefined) data.materials = p.materials as Inp;
    if (p.dimensions !== undefined) data.dimensions = p.dimensions as Inp;
    if (p.weight !== undefined) data.weight = p.weight as Inp;
    if (p.publishShops !== undefined) data.publishShops = p.publishShops as Inp;
    const updated = await db.product.update({
      where: { shopId_id: { shopId: shop, id: p.id } },
      data,
    });
    return toProduct(updated) as unknown as T;
  } catch (err) {
    console.error(`Failed to update product ${patch.id} for ${shop}`, err);
    return jsonProductsRepository.update(shop, patch);
  }
}

async function remove(shop: string, id: string): Promise<void> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.delete(shop, id);
  }
  try {
    await db.product.delete({ where: { shopId_id: { shopId: shop, id } } });
  } catch (err) {
    console.error(`Failed to delete product ${id} for ${shop}`, err);
    return jsonProductsRepository.delete(shop, id);
  }
}

async function duplicate<T extends ProductPublication = ProductPublication>(
  shop: string,
  id: string,
): Promise<T> {
  const db = prisma;
  if (!db.product) {
    return jsonProductsRepository.duplicate(shop, id);
  }
  try {
    const original = await db.product.findUnique({
      where: { shopId_id: { shopId: shop, id } },
    });
    if (!original) throw new Error(`Product ${id} not found in ${shop}`);
    const now = new Date();
    const copy = await db.product.create({
      data: {
        id: ulid(),
        shopId: shop,
        sku: `${original.sku}-copy`,
        title: original.title,
        description: original.description,
        media: original.media,
        price: original.price,
        currency: original.currency,
        status: "draft",
        row_version: 1,
        forSale: original.forSale,
        forRental: original.forRental,
        deposit: original.deposit,
        rentalTerms: original.rentalTerms,
        dailyRate: original.dailyRate,
        weeklyRate: original.weeklyRate,
        monthlyRate: original.monthlyRate,
        wearAndTearLimit: original.wearAndTearLimit,
        maintenanceCycle: original.maintenanceCycle,
        availability: original.availability ?? undefined,
        materials: original.materials ?? undefined,
        dimensions: original.dimensions ?? undefined,
        weight: original.weight ?? undefined,
        publishShops: original.publishShops ?? undefined,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toProduct(copy) as unknown as T;
  } catch (err) {
    console.error(`Failed to duplicate product ${id} for ${shop}`, err);
    return jsonProductsRepository.duplicate(shop, id);
  }
}

export const prismaProductsRepository: ProductsRepository = {
  read,
  write,
  create,
  getById,
  update,
  delete: remove,
  duplicate,
};
