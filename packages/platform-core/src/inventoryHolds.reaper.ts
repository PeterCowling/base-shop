import type { InventoryHoldDb } from "./inventoryHolds.db";

export async function releaseExpiredInventoryHolds(params: {
  shopId: string;
  tx: InventoryHoldDb;
  now: Date;
  limit: number;
}): Promise<void> {
  const { shopId, tx, now } = params;
  const limit = Math.max(1, params.limit);
  if (!tx.inventoryItem) return;

  const candidates = await tx.inventoryHold.findMany({
    where: { shopId, status: "active", expiresAt: { lte: now } },
    select: { id: true },
    orderBy: { expiresAt: "asc" },
    take: limit,
  });

  for (const row of candidates) {
    const holdId = row.id;
    const updated = await tx.inventoryHold.updateMany({
      where: { id: holdId, shopId, status: "active" },
      data: { status: "expired", expiredAt: now },
    });
    if (updated.count !== 1) continue;

    const items = await tx.inventoryHoldItem.findMany({ where: { holdId } });
    for (const item of items) {
      const current = await tx.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: { shopId, sku: item.sku, variantKey: item.variantKey },
        },
      });
      if (current) {
        await tx.inventoryItem.updateMany({
          where: { shopId, sku: item.sku, variantKey: item.variantKey },
          data: { quantity: { increment: item.quantity } },
        });
        continue;
      }

      await tx.inventoryItem.upsert({
        where: {
          shopId_sku_variantKey: { shopId, sku: item.sku, variantKey: item.variantKey },
        },
        create: {
          shopId,
          sku: item.sku,
          productId: item.productId,
          variantKey: item.variantKey,
          variantAttributes: item.variantAttributes,
          quantity: item.quantity,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });
    }
  }
}

