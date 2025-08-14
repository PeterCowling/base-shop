import "server-only";

import type { ProductCore } from "@acme/types";
import {
  readInventoryMap,
  updateInventoryItem,
  variantKey,
} from "../repositories/inventory.server";

function windowAvailable(
  product: Pick<ProductCore, "availability">,
  from: string,
  to: string,
): boolean {
  if (!product.availability) return true;
  const start = new Date(from).toISOString();
  const end = new Date(to).toISOString();
  return product.availability.every(
    (w) => end <= w.from || start >= w.to,
  );
}

/**
 * Reserve a rental item if available and within wear limits.
 * Returns true if the item was reserved.
 */
export async function reserveRentalInventory(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  product: Pick<
    ProductCore,
    "availability" | "wearAndTearLimit" | "maintenanceCycle"
  >,
  from: string,
  to: string,
): Promise<boolean> {
  if (!windowAvailable(product, from, to)) return false;

  const map = await readInventoryMap(shop);
  const key = variantKey(sku, variantAttributes);
  const item = map[key];
  if (!item || item.quantity <= 0) return false;

  const wear = (item as any).wearCount ?? 0;
  if (
    product.wearAndTearLimit !== undefined &&
    wear >= product.wearAndTearLimit
  ) {
    return false;
  }
  if (
    product.maintenanceCycle !== undefined &&
    wear >= product.maintenanceCycle
  ) {
    return false;
  }

  await updateInventoryItem(shop, sku, variantAttributes, (i) => {
    const wearCount = (i as any).wearCount ?? 0;
    return { ...i, quantity: i.quantity - 1, wearCount: wearCount + 1 } as any;
  });
  return true;
}

export { windowAvailable as isRentalWindowAvailable };
