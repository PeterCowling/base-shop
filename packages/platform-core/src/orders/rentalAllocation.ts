import type { SKU } from "@acme/types";

import { updateInventoryItem } from "../repositories/inventory.server";
import type { InventoryItem } from "../types/inventory";

/**
 * Reserve a rental inventory item if available and within wear limits.
 *
 * @param items - inventory items for the SKU
 * @param sku - product information containing availability and wear limits
 * @param from - desired rental start ISO date
 * @param to - desired rental end ISO date
 * @returns the reserved item or null if none available
 */
export async function reserveRentalInventory(
  shop: string,
  items: InventoryItem[],
  sku: SKU,
  from: string,
  to: string,
): Promise<(InventoryItem & { wearCount: number }) | null> {
  // verify availability window
  if (
    sku.availability &&
    !sku.availability.some(
      (window: NonNullable<SKU["availability"]>[number]) =>
        from >= window.from && to <= window.to,
    )
  ) {
    return null;
  }

  const limit = sku.wearAndTearLimit ?? Infinity;
  const cycle = sku.maintenanceCycle ?? Infinity;

  const candidate = items.find((item: InventoryItem) => {
    const wear = item.wearCount ?? 0;
    if (wear >= limit) return false; // item exceeded wear limit
    if (cycle !== Infinity && wear > 0 && wear % cycle === 0) return false; // due for maintenance
    return item.quantity > 0; // must have stock
  });

  if (!candidate) return null;

  const updated = await updateInventoryItem(
    shop,
    candidate.sku,
    candidate.variantAttributes,
    (current) => {
      if (!current) return current;
      return {
        ...current,
        quantity: current.quantity - 1,
        wearCount: (current.wearCount ?? 0) + 1,
      };
    },
  );

  return updated
    ? (updated as InventoryItem & { wearCount: number })
    : null;
}
