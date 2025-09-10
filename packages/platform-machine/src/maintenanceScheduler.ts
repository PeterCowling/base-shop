import { readdir } from "fs/promises";
import { createRequire } from "module";
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
    let inventory;
    let products;
    try {
      [inventory, products] = await Promise.all([
        readInventory(shop),
        readProducts(shop),
      ]);
    } catch (err) {
      logger.error("maintenance scan failed", { shopId: shop, err });
      continue;
    }
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
  const requireSelf = createRequire(
    (() => {
      try {
        // eslint-disable-next-line no-eval
        return (0, eval)("import.meta.url");
      } catch {
        // @ts-ignore fallback for CommonJS
        return typeof __filename !== "undefined" ? __filename : "";
      }
    })(),
  );
  const run = () =>
    (requireSelf(
      "@acme/platform-machine/maintenanceScheduler",
    ) as typeof import("@acme/platform-machine/maintenanceScheduler")).runMaintenanceScan()
      .catch((err) => logger.error("maintenance scan failed", { err }));
  // run immediately then every night
  run();
  return setInterval(run, day);
}
