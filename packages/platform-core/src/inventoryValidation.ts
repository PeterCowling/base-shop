import "server-only";

import type { CartState } from "./cart";
import { readInventory } from "./repositories/inventory.server";
import { variantKey } from "./types/inventory";

// Central inventory imports (lazy to avoid circular deps)
type CentralInventoryModule = typeof import("./centralInventory/centralInventory.server");

export type InventoryValidationRequest = {
  sku: string;
  quantity: number;
  variantAttributes?: Record<string, string>;
};

export type InventoryValidationFailure = {
  sku: string;
  variantAttributes: Record<string, string>;
  variantKey: string;
  requested: number;
  available: number;
};

export function cartToInventoryRequests(
  cart: CartState,
): InventoryValidationRequest[] {
  return Object.values(cart).map((line) => {
    const size = typeof line.size === "string" ? line.size.trim() : "";
    return {
      sku: line.sku.id,
      quantity: line.qty,
      variantAttributes: size ? { size } : undefined,
    };
  });
}

function normalizeRequests(
  requests: InventoryValidationRequest[],
): Map<string, InventoryValidationFailure> {
  const map = new Map<string, InventoryValidationFailure>();
  for (const item of requests) {
    const attrs = item.variantAttributes ?? {};
    const key = variantKey(item.sku, attrs);
    const entry = map.get(key);
    if (entry) {
      entry.requested += item.quantity;
    } else {
      map.set(key, {
        sku: item.sku,
        variantAttributes: attrs,
        variantKey: key,
        requested: item.quantity,
        available: 0,
      });
    }
  }
  return map;
}

export async function validateInventoryAvailability(
  shopId: string,
  requests: InventoryValidationRequest[],
): Promise<{ ok: true } | { ok: false; insufficient: InventoryValidationFailure[] }> {
  const requested = normalizeRequests(requests);
  const inventory = await readInventory(shopId);
  const available = new Map<string, number>();

  for (const item of inventory) {
    const key = variantKey(item.sku, item.variantAttributes);
    available.set(key, item.quantity);
  }

  const insufficient: InventoryValidationFailure[] = [];
  for (const entry of requested.values()) {
    const qty = available.get(entry.variantKey) ?? 0;
    entry.available = qty;
    if (entry.requested > qty) {
      insufficient.push({ ...entry });
    }
  }

  if (insufficient.length) {
    return { ok: false, insufficient };
  }
  return { ok: true };
}

/**
 * Validate inventory against central inventory allocations for a shop.
 * Falls back to per-shop inventory if central inventory is unavailable.
 */
export async function validateInventoryFromCentral(
  shopId: string,
  requests: InventoryValidationRequest[],
): Promise<{ ok: true } | { ok: false; insufficient: InventoryValidationFailure[] }> {
  const requested = normalizeRequests(requests);

  let centralModule: CentralInventoryModule | null = null;
  try {
    centralModule = await import("./centralInventory/centralInventory.server");
  } catch {
    // Central inventory not available, fall back to shop inventory
    return validateInventoryAvailability(shopId, requests);
  }

  const allocations = await centralModule.calculateAllAllocationsForShop(shopId);
  if (!allocations.length) {
    // No central inventory routing, fall back to shop inventory
    return validateInventoryAvailability(shopId, requests);
  }

  const available = new Map<string, number>();
  for (const allocation of allocations) {
    available.set(allocation.variantKey, allocation.allocatedQuantity);
  }

  const insufficient: InventoryValidationFailure[] = [];
  for (const entry of requested.values()) {
    const qty = available.get(entry.variantKey) ?? 0;
    entry.available = qty;
    if (entry.requested > qty) {
      insufficient.push({ ...entry });
    }
  }

  if (insufficient.length) {
    return { ok: false, insufficient };
  }
  return { ok: true };
}
