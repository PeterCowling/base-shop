import { readdir } from "node:fs/promises";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { readInventory } from "@platform-core/repositories/inventory.server";
import { readRepo as readProducts } from "@platform-core/repositories/products.server";
import type { ProductCore } from "@acme/types";
import { logger } from "@platform-core/utils";

const DATA_ROOT = resolveDataRoot();

async function checkShop(shop: string): Promise<void> {
  const items = await readInventory(shop);
  const products = await readProducts<ProductCore>(shop);
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) continue;
    const wear = (item as any).wearCount ?? 0;
    if (
      product.wearAndTearLimit !== undefined &&
      wear >= product.wearAndTearLimit
    ) {
      logger.info("item ready for retirement", { shopId: shop, sku: item.sku });
    } else if (
      product.maintenanceCycle !== undefined &&
      wear >= product.maintenanceCycle
    ) {
      logger.info("item requires maintenance", { shopId: shop, sku: item.sku });
    }
  }
}

export async function runMaintenanceOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  for (const shop of shops) {
    await checkShop(shop);
  }
}

export async function startMaintenanceScheduler(
  intervalMs = 24 * 60 * 60 * 1000,
): Promise<() => void> {
  await runMaintenanceOnce();
  const timer = setInterval(() => {
    runMaintenanceOnce().catch((err) =>
      logger.error("maintenance check failed", { err }),
    );
  }, intervalMs);
  return () => clearInterval(timer);
}
