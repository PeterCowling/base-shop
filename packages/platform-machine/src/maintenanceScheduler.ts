import { readdir } from "fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import { logger } from "@platform-core/utils";

const DATA_ROOT = resolveDataRoot();

/**
 * Scan inventory nightly and log items that require maintenance or retirement.
 */
export async function runMaintenanceScan(
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const shops = await readdir(dataRoot);
  for (const shop of shops) {
    const [inventory, products] = await Promise.all([
      readInventory(shop),
      readProducts(shop),
    ]);
    const productMap = new Map(products.map((p) => [p.sku, p]));

    for (const item of inventory) {
      const product = productMap.get(item.sku);
      if (!product) continue;
      const wear = item.wearCount ?? 0;
      const limit = product.wearAndTearLimit ?? Infinity;
      const cycle = product.maintenanceCycle ?? Infinity;
      if (wear >= limit) {
        logger.info("item needs retirement", { shopId: shop, sku: item.sku });
      } else if (cycle !== Infinity && wear > 0 && wear % cycle === 0) {
        logger.info("item needs maintenance", { shopId: shop, sku: item.sku });
      }
    }
  }
}

/**
 * Start nightly maintenance scheduler.
 */
export function startMaintenanceScheduler(): NodeJS.Timeout {
  const day = 24 * 60 * 60 * 1000;
  const run = () =>
    runMaintenanceScan().catch((err) =>
      logger.error("maintenance scan failed", { err }),
    );
  // run immediately then every night
  run();
  return setInterval(run, day);
}
