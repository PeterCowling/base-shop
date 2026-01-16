import type { Prisma } from "@prisma/client";
import { releaseExpiredInventoryHolds } from "../inventoryHolds.reaper";
import type { InventoryHoldDb } from "../inventoryHolds.db";
import { listShops } from "../repositories/shops.server";
import { prisma } from "../db";

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
          tx: tx as unknown as InventoryHoldDb,
          now: new Date(),
          limit: 100,
        });
      });
      processedShops++;
      console.log(`[Reaper] Successfully processed holds for shop: ${shopId}`);
    } catch (err) {
      console.error(`[Reaper] Failed to release expired holds for shop ${shopId}:`, err);
      failedShops.push(shopId);
    }
  }

  console.log(`[Reaper] Completed. Processed: ${processedShops}, Failed: ${failedShops.length}`);

  return {
    processedShops,
    failedShops,
  };
}
