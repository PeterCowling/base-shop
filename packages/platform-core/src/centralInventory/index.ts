/**
 * Central Inventory Module (LAUNCH-13b)
 *
 * Central inventory is the source of truth for stock across all shops.
 * Per-shop inventory is derived from central inventory + routing rules.
 *
 * @example
 * ```ts
 * import {
 *   createCentralInventoryItem,
 *   addRouting,
 *   syncToShopInventory,
 * } from "@acme/platform-core/centralInventory";
 *
 * // Create central inventory item
 * const item = await createCentralInventoryItem({
 *   sku: "TSHIRT-001",
 *   productId: "prod_123",
 *   variantAttributes: { size: "M", color: "blue" },
 *   quantity: 100,
 * });
 *
 * // Route to shops
 * await addRouting(item.id, { shopId: "shop-a", allocationMode: "all" });
 * await addRouting(item.id, { shopId: "shop-b", allocationMode: "percentage", allocatedPercent: 30 });
 *
 * // Sync to shop inventory
 * await syncToShopInventory("shop-a");
 * ```
 */

// Types
export type {
  AllocationMode,
  CentralInventoryImportItem,
  CentralInventoryImportResult,
  CentralInventoryInput,
  CentralInventoryItem,
  CentralInventoryWithRoutings,
  InventoryRouting,
  RoutingInput,
  ShopAllocation,
  SyncResult,
} from "./types";
export {
  allocationModeSchema,
  centralInventoryImportItemSchema,
  centralInventoryInputSchema,
  centralInventoryItemSchema,
  centralInventoryWithRoutingsSchema,
  inventoryRoutingSchema,
  routingInputSchema,
} from "./types";

// Server functions (re-exported for convenience, but consumers should import from .server)

// CSV ingest (re-exported for convenience, but consumers should import from ./csvIngest)
