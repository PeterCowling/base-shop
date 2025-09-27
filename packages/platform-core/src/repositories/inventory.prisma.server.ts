import "server-only";

import { prisma } from "../db";
import {
  inventoryItemSchema,
  type InventoryItem,
  variantKey,
} from "../types/inventory";
// eslint-disable-next-line no-restricted-imports -- DS-000 allow fallback JSON repo import for prisma adapter
import { jsonInventoryRepository } from "./inventory.json.server";
import type {
  InventoryRepository,
  InventoryMutateFn,
} from "./inventory.types";

interface InventoryItemModel {
  findMany(args: unknown): Promise<unknown[]>;
  deleteMany(args: unknown): Promise<unknown>;
  createMany(args: unknown): Promise<unknown>;
  findUnique(args: unknown): Promise<unknown | null>;
  delete(args: unknown): Promise<unknown>;
  upsert(args: unknown): Promise<unknown>;
}

interface InventoryDb {
  inventoryItem?: InventoryItemModel;
  $transaction<T>(fn: (tx: InventoryDb) => Promise<T>): Promise<T>;
}

function toInventoryItem(record: unknown): InventoryItem {
  const r = record as Record<string, unknown>;
  return inventoryItemSchema.parse({
    sku: r.sku,
    productId: r.productId,
    quantity: r.quantity,
    variantAttributes: (r.variantAttributes as Record<string, string> | undefined) ?? {},
    ...(r.lowStockThreshold !== null
      ? { lowStockThreshold: r.lowStockThreshold }
      : {}),
    ...(r.wearCount !== null ? { wearCount: r.wearCount } : {}),
    ...(r.wearAndTearLimit !== null
      ? { wearAndTearLimit: r.wearAndTearLimit }
      : {}),
    ...(r.maintenanceCycle !== null
      ? { maintenanceCycle: r.maintenanceCycle }
      : {}),
  });
}

async function read(shop: string): Promise<InventoryItem[]> {
  const db = prisma as InventoryDb;
  if (!db.inventoryItem) {
    return jsonInventoryRepository.read(shop);
  }
  try {
    const rows = await db.inventoryItem.findMany({
      where: { shopId: shop },
    });
    return rows.map(toInventoryItem);
  } catch (err) {
    console.error(`Failed to read inventory for ${shop}`, err);
    return jsonInventoryRepository.read(shop);
  }
}

async function write(shop: string, items: InventoryItem[]): Promise<void> {
  const db = prisma as InventoryDb;
  if (!db.inventoryItem) {
    return jsonInventoryRepository.write(shop, items);
  }
  const normalized = inventoryItemSchema.array().parse(items);
  try {
    await db.$transaction(async (tx) => {
      await tx.inventoryItem!.deleteMany({ where: { shopId: shop } });
      if (normalized.length) {
        await tx.inventoryItem!.createMany({
          data: normalized.map((i: InventoryItem) => ({
            shopId: shop,
            sku: i.sku,
            productId: i.productId,
            quantity: i.quantity,
            variantAttributes: i.variantAttributes,
            lowStockThreshold: i.lowStockThreshold ?? null,
            wearCount: i.wearCount ?? null,
            wearAndTearLimit: i.wearAndTearLimit ?? null,
            maintenanceCycle: i.maintenanceCycle ?? null,
            variantKey: variantKey(i.sku, i.variantAttributes),
          })),
        });
      }
    });
    await jsonInventoryRepository.write(shop, normalized);

    const hasLowStock = normalized.some(
      (i: InventoryItem) =>
        typeof i.lowStockThreshold === "number" &&
        i.quantity <= i.lowStockThreshold,
    );
    if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, normalized);
    }
  } catch (err) {
    console.error(`Failed to write inventory for ${shop}`, err);
    return jsonInventoryRepository.write(shop, items);
  }
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const db = prisma as InventoryDb;
  if (!db.inventoryItem) {
    return jsonInventoryRepository.update(shop, sku, variantAttributes, mutate);
  }
  const key = variantKey(sku, variantAttributes);
  try {
    const result = await db.$transaction(async (tx) => {
      const record = await tx.inventoryItem!.findUnique({
        where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
      });
      const current = record ? toInventoryItem(record) : undefined;
      const updated = mutate(current);
      if (updated === undefined) {
        if (record) {
          await tx.inventoryItem!.delete({
            where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
          });
        }
        const remaining = await tx.inventoryItem!.findMany({ where: { shopId: shop } });
        return { updated: undefined, all: remaining.map(toInventoryItem) };
      }
      const nextItem = inventoryItemSchema.parse({
        ...current,
        ...updated,
        sku,
        variantAttributes,
      });
      await tx.inventoryItem!.upsert({
        where: { shopId_sku_variantKey: { shopId: shop, sku, variantKey: key } },
        update: {
          productId: nextItem.productId,
          quantity: nextItem.quantity,
          variantAttributes: nextItem.variantAttributes,
          lowStockThreshold: nextItem.lowStockThreshold ?? null,
          wearCount: nextItem.wearCount ?? null,
          wearAndTearLimit: nextItem.wearAndTearLimit ?? null,
          maintenanceCycle: nextItem.maintenanceCycle ?? null,
          variantKey: key,
        },
        create: {
          shopId: shop,
          sku: nextItem.sku,
          productId: nextItem.productId,
          quantity: nextItem.quantity,
          variantAttributes: nextItem.variantAttributes,
          lowStockThreshold: nextItem.lowStockThreshold ?? null,
          wearCount: nextItem.wearCount ?? null,
          wearAndTearLimit: nextItem.wearAndTearLimit ?? null,
          maintenanceCycle: nextItem.maintenanceCycle ?? null,
          variantKey: key,
        },
      });
      const remaining = await tx.inventoryItem!.findMany({ where: { shopId: shop } });
      return { updated: nextItem, all: remaining.map(toInventoryItem) };
    });

    const { updated, all } = result;
    const hasLowStock = all.some(
      (i: InventoryItem) =>
        typeof i.lowStockThreshold === "number" &&
        i.quantity <= i.lowStockThreshold,
    );
    if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, all);
    }

    return updated;
  } catch (err) {
    console.error(`Failed to update inventory for ${shop}`, err);
    return jsonInventoryRepository.update(shop, sku, variantAttributes, mutate);
  }
}

export const prismaInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};
