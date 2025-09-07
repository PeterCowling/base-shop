import "server-only";

import { prisma } from "../db";
import { jsonInventoryRepository } from "./inventory.json.server";
import {
  inventoryItemSchema,
  type InventoryItem,
  variantKey,
} from "../types/inventory";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

function fromRecord(r: any): InventoryItem {
  return inventoryItemSchema.parse({
    sku: r.sku,
    productId: r.productId,
    quantity: r.quantity,
    variantAttributes: r.variantAttributes ?? {},
    ...(r.lowStockThreshold == null
      ? {}
      : { lowStockThreshold: r.lowStockThreshold }),
    ...(r.wearCount == null ? {} : { wearCount: r.wearCount }),
    ...(r.wearAndTearLimit == null
      ? {}
      : { wearAndTearLimit: r.wearAndTearLimit }),
    ...(r.maintenanceCycle == null
      ? {}
      : { maintenanceCycle: r.maintenanceCycle }),
  });
}

async function read(shop: string): Promise<InventoryItem[]> {
  const client: any = prisma;
  try {
    const rows = await client.inventoryItem.findMany({ where: { shopId: shop } });
    return inventoryItemSchema.array().parse(rows.map(fromRecord));
  } catch {
    return jsonInventoryRepository.read(shop);
  }
}

async function write(shop: string, items: InventoryItem[]): Promise<void> {
  const client: any = prisma;
  const parsed = inventoryItemSchema.array().parse(items);
  try {
    await client.$transaction([
      client.inventoryItem.deleteMany({ where: { shopId: shop } }),
      client.inventoryItem.createMany({
        data: parsed.map((i) => ({
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
      }),
    ]);
  } catch {
    await jsonInventoryRepository.write(shop, parsed);
    return;
  }
  await jsonInventoryRepository.write(shop, parsed);
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const items = await read(shop);
  const key = variantKey(sku, variantAttributes);
  const idx = items.findIndex(
    (i) => variantKey(i.sku, i.variantAttributes) === key,
  );
  const current = idx === -1 ? undefined : items[idx];
  const updated = mutate(current);
  if (updated === undefined) {
    if (idx !== -1) items.splice(idx, 1);
  } else {
    const normalized = inventoryItemSchema.parse({
      ...updated,
      sku,
      variantAttributes,
    });
    if (idx === -1) items.push(normalized);
    else items[idx] = normalized;
  }
  await write(shop, items);
  return updated
    ? inventoryItemSchema.parse({
        ...updated,
        sku,
        variantAttributes,
      })
    : undefined;
}

export const prismaInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};
