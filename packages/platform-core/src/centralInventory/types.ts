import { z } from "zod";

/**
 * Central Inventory Types (LAUNCH-13b)
 *
 * Central inventory is the source of truth for stock across all shops.
 * Per-shop inventory is derived from central inventory + routing rules.
 */

// ============================================================
// Allocation Modes
// ============================================================

export const allocationModeSchema = z.enum(["all", "fixed", "percentage"]);
export type AllocationMode = z.infer<typeof allocationModeSchema>;

// ============================================================
// Central Inventory Item
// ============================================================

export const centralInventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string().min(1),
  productId: z.string().min(1),
  variantKey: z.string(),
  variantAttributes: z.record(z.string()),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  wearCount: z.number().int().min(0).optional(),
  wearAndTearLimit: z.number().int().min(0).optional(),
  maintenanceCycle: z.number().int().min(0).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type CentralInventoryItem = z.infer<typeof centralInventoryItemSchema>;

// ============================================================
// Inventory Routing
// ============================================================

export const inventoryRoutingSchema = z.object({
  id: z.string(),
  centralInventoryItemId: z.string(),
  shopId: z.string().min(1),
  allocationMode: allocationModeSchema.default("all"),
  allocatedQuantity: z.number().int().min(0).optional(),
  allocatedPercent: z.number().int().min(0).max(100).optional(),
  priority: z.number().int().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InventoryRouting = z.infer<typeof inventoryRoutingSchema>;

// ============================================================
// Central Inventory with Routings (joined)
// ============================================================

export const centralInventoryWithRoutingsSchema = centralInventoryItemSchema.extend({
  routings: z.array(inventoryRoutingSchema),
});

export type CentralInventoryWithRoutings = z.infer<typeof centralInventoryWithRoutingsSchema>;

// ============================================================
// Computed Shop Allocation
// ============================================================

export interface ShopAllocation {
  shopId: string;
  sku: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  productId: string;
  /** Quantity allocated to this shop based on routing rules */
  allocatedQuantity: number;
  /** Source central inventory item ID */
  centralInventoryItemId: string;
}

// ============================================================
// Central Inventory Input (for create/update)
// ============================================================

export const centralInventoryInputSchema = z.object({
  sku: z.string().min(1),
  productId: z.string().min(1),
  variantAttributes: z.record(z.string()).default({}),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  wearCount: z.number().int().min(0).optional(),
  wearAndTearLimit: z.number().int().min(0).optional(),
  maintenanceCycle: z.number().int().min(0).optional(),
});

export type CentralInventoryInput = z.infer<typeof centralInventoryInputSchema>;

// ============================================================
// Routing Input (for create/update)
// ============================================================

export const routingInputSchema = z.object({
  shopId: z.string().min(1),
  allocationMode: allocationModeSchema.default("all"),
  allocatedQuantity: z.number().int().min(0).optional(),
  allocatedPercent: z.number().int().min(0).max(100).optional(),
  priority: z.number().int().default(0),
});

export type RoutingInput = z.infer<typeof routingInputSchema>;

// ============================================================
// Sync Result
// ============================================================

export interface SyncResult {
  shopId: string;
  synced: number;
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ sku: string; variantKey: string; error: string }>;
}

// ============================================================
// Central Inventory Import (CSV/bulk)
// ============================================================

export const centralInventoryImportItemSchema = z.object({
  sku: z.string().min(1),
  productId: z.string().min(1),
  variantAttributes: z.record(z.string()).default({}),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  /** Shop IDs to route this item to (default: all shops) */
  routeToShops: z.array(z.string()).optional(),
});

export type CentralInventoryImportItem = z.infer<typeof centralInventoryImportItemSchema>;

export interface CentralInventoryImportResult {
  ok: boolean;
  imported: number;
  created: number;
  updated: number;
  errors: Array<{ row: number; sku: string; error: string }>;
}
