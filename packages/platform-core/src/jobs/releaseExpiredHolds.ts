import type { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { releaseExpiredInventoryHolds } from "../inventoryHolds.reaper";
import { listShops } from "../repositories/shops.server";

export async function releaseExpiredHoldsForAllShops(): Promise<{
  processedShops: number;
  failedShops: string[];
}> {
  const shops = await listShops(1, 1000); // Get up to 1000 shops
  const failedShops: string[] = [];
  let processedShops = 0;

  for (const shopId of shops) {
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await releaseExpiredInventoryHolds({
          shopId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma tx is compatible with InventoryHoldDb at runtime
          tx: tx as any,
          now: new Date(),
          limit: 100,
        });
      });
      processedShops++;
      console.info(`[Reaper] Successfully processed holds for shop: ${shopId}`);
    } catch (err) {
      console.error(`[Reaper] Failed to release expired holds for shop ${shopId}:`, err);
      failedShops.push(shopId);
    }
  }

  console.info(`[Reaper] Completed. Processed: ${processedShops}, Failed: ${failedShops.length}`);

  return {
    processedShops,
    failedShops,
  };
}
