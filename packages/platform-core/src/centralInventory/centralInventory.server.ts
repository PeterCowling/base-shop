import "server-only";

import { ulid } from "ulid";

import { prisma } from "../db";

import type {
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

// ============================================================
// Central Inventory CRUD
// ============================================================

export async function createCentralInventoryItem(
  input: CentralInventoryInput,
): Promise<CentralInventoryItem> {
  const variantKey = buildVariantKey(input.sku, input.variantAttributes ?? {});

  const record = await prisma.centralInventoryItem.create({
    data: {
      id: ulid(),
      sku: input.sku,
      productId: input.productId,
      variantKey,
      variantAttributes: input.variantAttributes ?? {},
      quantity: input.quantity,
      lowStockThreshold: input.lowStockThreshold,
      wearCount: input.wearCount,
      wearAndTearLimit: input.wearAndTearLimit,
      maintenanceCycle: input.maintenanceCycle,
    },
  });

  return mapCentralInventoryItem(record);
}

export async function getCentralInventoryItem(
  id: string,
): Promise<CentralInventoryItem | null> {
  const record = await prisma.centralInventoryItem.findUnique({
    where: { id },
  });
  return record ? mapCentralInventoryItem(record) : null;
}

export async function getCentralInventoryBySku(
  sku: string,
  variantAttributes: Record<string, string> = {},
): Promise<CentralInventoryItem | null> {
  const variantKey = buildVariantKey(sku, variantAttributes);
  const record = await prisma.centralInventoryItem.findUnique({
    where: { sku_variantKey: { sku, variantKey } },
  });
  return record ? mapCentralInventoryItem(record) : null;
}

export async function listCentralInventory(options?: {
  productId?: string;
  limit?: number;
  offset?: number;
}): Promise<CentralInventoryItem[]> {
  const records = await prisma.centralInventoryItem.findMany({
    where: options?.productId ? { productId: options.productId } : undefined,
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
    orderBy: { sku: "asc" },
  });
  return records.map(mapCentralInventoryItem);
}

export async function updateCentralInventoryItem(
  id: string,
  updates: Partial<CentralInventoryInput>,
): Promise<CentralInventoryItem | null> {
  const existing = await prisma.centralInventoryItem.findUnique({
    where: { id },
  });
  if (!existing) return null;

  const variantAttributes =
    updates.variantAttributes !== undefined
      ? updates.variantAttributes
      : (existing.variantAttributes as Record<string, string>);
  const variantKey = buildVariantKey(
    updates.sku ?? existing.sku,
    variantAttributes,
  );

  const record = await prisma.centralInventoryItem.update({
    where: { id },
    data: {
      ...(updates.sku !== undefined && { sku: updates.sku }),
      ...(updates.productId !== undefined && { productId: updates.productId }),
      ...(updates.variantAttributes !== undefined && {
        variantAttributes: updates.variantAttributes,
        variantKey,
      }),
      ...(updates.quantity !== undefined && { quantity: updates.quantity }),
      ...(updates.lowStockThreshold !== undefined && {
        lowStockThreshold: updates.lowStockThreshold,
      }),
      ...(updates.wearCount !== undefined && { wearCount: updates.wearCount }),
      ...(updates.wearAndTearLimit !== undefined && {
        wearAndTearLimit: updates.wearAndTearLimit,
      }),
      ...(updates.maintenanceCycle !== undefined && {
        maintenanceCycle: updates.maintenanceCycle,
      }),
    },
  });

  return mapCentralInventoryItem(record);
}

export async function deleteCentralInventoryItem(id: string): Promise<boolean> {
  try {
    await prisma.centralInventoryItem.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function adjustCentralInventoryQuantity(
  id: string,
  delta: number,
): Promise<CentralInventoryItem | null> {
  const record = await prisma.centralInventoryItem.update({
    where: { id },
    data: {
      quantity: { increment: delta },
    },
  });
  return mapCentralInventoryItem(record);
}

// ============================================================
// Routing CRUD
// ============================================================

export async function addRouting(
  centralInventoryItemId: string,
  input: RoutingInput,
): Promise<InventoryRouting> {
  const record = await prisma.inventoryRouting.create({
    data: {
      id: ulid(),
      centralInventoryItemId,
      shopId: input.shopId,
      allocationMode: input.allocationMode ?? "all",
      allocatedQuantity: input.allocatedQuantity,
      allocatedPercent: input.allocatedPercent,
      priority: input.priority ?? 0,
    },
  });
  return mapInventoryRouting(record);
}

export async function getRouting(id: string): Promise<InventoryRouting | null> {
  const record = await prisma.inventoryRouting.findUnique({ where: { id } });
  return record ? mapInventoryRouting(record) : null;
}

export async function listRoutingsForItem(
  centralInventoryItemId: string,
): Promise<InventoryRouting[]> {
  const records = await prisma.inventoryRouting.findMany({
    where: { centralInventoryItemId },
    orderBy: { priority: "desc" },
  });
  return records.map(mapInventoryRouting);
}

export async function listRoutingsForShop(
  shopId: string,
): Promise<InventoryRouting[]> {
  const records = await prisma.inventoryRouting.findMany({
    where: { shopId },
    orderBy: { priority: "desc" },
  });
  return records.map(mapInventoryRouting);
}

export async function updateRouting(
  id: string,
  updates: Partial<RoutingInput>,
): Promise<InventoryRouting | null> {
  try {
    const record = await prisma.inventoryRouting.update({
      where: { id },
      data: {
        ...(updates.shopId !== undefined && { shopId: updates.shopId }),
        ...(updates.allocationMode !== undefined && {
          allocationMode: updates.allocationMode,
        }),
        ...(updates.allocatedQuantity !== undefined && {
          allocatedQuantity: updates.allocatedQuantity,
        }),
        ...(updates.allocatedPercent !== undefined && {
          allocatedPercent: updates.allocatedPercent,
        }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
      },
    });
    return mapInventoryRouting(record);
  } catch {
    return null;
  }
}

export async function deleteRouting(id: string): Promise<boolean> {
  try {
    await prisma.inventoryRouting.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Allocation Calculation
// ============================================================

export async function calculateShopAllocations(
  centralInventoryItemId: string,
): Promise<ShopAllocation[]> {
  const item = await prisma.centralInventoryItem.findUnique({
    where: { id: centralInventoryItemId },
    include: { routings: { orderBy: { priority: "desc" } } },
  });

  if (!item) return [];

  return calculateAllocationsFromItem(mapCentralInventoryWithRoutings(item));
}

export async function calculateAllAllocationsForShop(
  shopId: string,
): Promise<ShopAllocation[]> {
  const routings = await prisma.inventoryRouting.findMany({
    where: { shopId },
    include: { centralInventoryItem: true },
  });

  const allocations: ShopAllocation[] = [];

  for (const routing of routings) {
    const item = mapCentralInventoryItem(routing.centralInventoryItem);
    const routingData = mapInventoryRouting(routing);
    const allocated = computeAllocation(item.quantity, routingData);

    allocations.push({
      shopId,
      sku: item.sku,
      variantKey: item.variantKey,
      variantAttributes: item.variantAttributes,
      productId: item.productId,
      allocatedQuantity: allocated,
      centralInventoryItemId: item.id,
    });
  }

  return allocations;
}

function calculateAllocationsFromItem(
  item: CentralInventoryWithRoutings,
): ShopAllocation[] {
  const allocations: ShopAllocation[] = [];
  let remaining = item.quantity;

  // Sort by priority (higher first)
  const sortedRoutings = [...item.routings].sort(
    (a, b) => b.priority - a.priority,
  );

  for (const routing of sortedRoutings) {
    const allocated = computeAllocation(remaining, routing, item.quantity);
    if (allocated > 0) {
      allocations.push({
        shopId: routing.shopId,
        sku: item.sku,
        variantKey: item.variantKey,
        variantAttributes: item.variantAttributes,
        productId: item.productId,
        allocatedQuantity: allocated,
        centralInventoryItemId: item.id,
      });
      // For fixed and percentage modes, we deduct from remaining
      // For "all" mode, each shop gets the full amount (no deduction)
      if (routing.allocationMode !== "all") {
        remaining = Math.max(0, remaining - allocated);
      }
    }
  }

  return allocations;
}

function computeAllocation(
  available: number,
  routing: InventoryRouting,
  totalQuantity?: number,
): number {
  const mode = routing.allocationMode as AllocationMode;

  switch (mode) {
    case "all":
      return available;

    case "fixed":
      return Math.min(routing.allocatedQuantity ?? 0, available);

    case "percentage": {
      const base = totalQuantity ?? available;
      const percent = routing.allocatedPercent ?? 0;
      return Math.min(Math.floor((base * percent) / 100), available);
    }

    default:
      return available;
  }
}

// ============================================================
// Sync to Per-Shop Inventory
// ============================================================

export async function syncToShopInventory(shopId: string): Promise<SyncResult> {
  const allocations = await calculateAllAllocationsForShop(shopId);

  const result: SyncResult = {
    shopId,
    synced: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  // Get current shop inventory SKUs routed from central
  const existingRoutings = await prisma.inventoryRouting.findMany({
    where: { shopId },
    select: {
      centralInventoryItem: {
        select: { sku: true, variantKey: true },
      },
    },
  });
  const routedKeys = new Set<string>(
    existingRoutings.map(
      (r: { centralInventoryItem: { sku: string; variantKey: string } }) =>
        `${r.centralInventoryItem.sku}|${r.centralInventoryItem.variantKey}`,
    ),
  );

  for (const allocation of allocations) {
    try {
      const existingItem = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId,
            sku: allocation.sku,
            variantKey: allocation.variantKey,
          },
        },
      });

      if (existingItem) {
        await prisma.inventoryItem.update({
          where: {
            shopId_sku_variantKey: {
              shopId,
              sku: allocation.sku,
              variantKey: allocation.variantKey,
            },
          },
          data: { quantity: allocation.allocatedQuantity },
        });
        result.updated++;
      } else {
        await prisma.inventoryItem.create({
          data: {
            shopId,
            sku: allocation.sku,
            productId: allocation.productId,
            variantKey: allocation.variantKey,
            variantAttributes: allocation.variantAttributes,
            quantity: allocation.allocatedQuantity,
          },
        });
        result.created++;
      }
      result.synced++;
    } catch (err) {
      result.errors.push({
        sku: allocation.sku,
        variantKey: allocation.variantKey,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Remove shop inventory items that are no longer routed
  const allocationKeys = new Set(
    allocations.map((a) => `${a.sku}|${a.variantKey}`),
  );
  for (const key of routedKeys) {
    if (!allocationKeys.has(key)) {
      const [sku = "", variantKey = ""] = key.split("|");
      try {
        await prisma.inventoryItem.delete({
          where: {
            shopId_sku_variantKey: { shopId, sku, variantKey },
          },
        });
        result.deleted++;
      } catch {
        // Item may have been manually deleted or modified
      }
    }
  }

  return result;
}

export async function syncAllShops(): Promise<SyncResult[]> {
  // Get all unique shop IDs that have routings
  const shopIds = await prisma.inventoryRouting.findMany({
    select: { shopId: true },
    distinct: ["shopId"],
  });

  const results: SyncResult[] = [];
  for (const { shopId } of shopIds) {
    results.push(await syncToShopInventory(shopId));
  }
  return results;
}

// ============================================================
// Bulk Import
// ============================================================

export async function importCentralInventory(
  items: CentralInventoryImportItem[],
): Promise<CentralInventoryImportResult> {
  const result: CentralInventoryImportResult = {
    ok: true,
    imported: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const row = i + 1;

    try {
      const variantKey = buildVariantKey(item.sku, item.variantAttributes ?? {});
      const existing = await prisma.centralInventoryItem.findUnique({
        where: { sku_variantKey: { sku: item.sku, variantKey } },
      });

      if (existing) {
        await prisma.centralInventoryItem.update({
          where: { id: existing.id },
          data: {
            productId: item.productId,
            variantAttributes: item.variantAttributes ?? {},
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
          },
        });
        result.updated++;
      } else {
        const newItem = await prisma.centralInventoryItem.create({
          data: {
            id: ulid(),
            sku: item.sku,
            productId: item.productId,
            variantKey,
            variantAttributes: item.variantAttributes ?? {},
            quantity: item.quantity,
            lowStockThreshold: item.lowStockThreshold,
          },
        });

        // Create routings for specified shops
        if (item.routeToShops?.length) {
          for (const shopId of item.routeToShops) {
            await prisma.inventoryRouting.create({
              data: {
                id: ulid(),
                centralInventoryItemId: newItem.id,
                shopId,
                allocationMode: "all",
                priority: 0,
              },
            });
          }
        }
        result.created++;
      }
      result.imported++;
    } catch (err) {
      result.errors.push({
        row,
        sku: item.sku,
        error: err instanceof Error ? err.message : String(err),
      });
      result.ok = false;
    }
  }

  return result;
}

// ============================================================
// Helpers
// ============================================================

function buildVariantKey(
  sku: string,
  variantAttributes: Record<string, string>,
): string {
  const sortedEntries = Object.entries(variantAttributes).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  if (sortedEntries.length === 0) return sku;
  return `${sku}:${sortedEntries.map(([k, v]) => `${k}=${v}`).join(",")}`;
}

interface PrismaCentralInventoryItem {
  id: string;
  sku: string;
  productId: string;
  variantKey: string;
  variantAttributes: unknown;
  quantity: number;
  lowStockThreshold: number | null;
  wearCount: number | null;
  wearAndTearLimit: number | null;
  maintenanceCycle: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaInventoryRouting {
  id: string;
  centralInventoryItemId: string;
  shopId: string;
  allocationMode: string;
  allocatedQuantity: number | null;
  allocatedPercent: number | null;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

function mapCentralInventoryItem(
  record: PrismaCentralInventoryItem,
): CentralInventoryItem {
  return {
    id: record.id,
    sku: record.sku,
    productId: record.productId,
    variantKey: record.variantKey,
    variantAttributes: record.variantAttributes as Record<string, string>,
    quantity: record.quantity,
    lowStockThreshold: record.lowStockThreshold ?? undefined,
    wearCount: record.wearCount ?? undefined,
    wearAndTearLimit: record.wearAndTearLimit ?? undefined,
    maintenanceCycle: record.maintenanceCycle ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapInventoryRouting(record: PrismaInventoryRouting): InventoryRouting {
  return {
    id: record.id,
    centralInventoryItemId: record.centralInventoryItemId,
    shopId: record.shopId,
    allocationMode: record.allocationMode as AllocationMode,
    allocatedQuantity: record.allocatedQuantity ?? undefined,
    allocatedPercent: record.allocatedPercent ?? undefined,
    priority: record.priority,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapCentralInventoryWithRoutings(
  record: PrismaCentralInventoryItem & { routings: PrismaInventoryRouting[] },
): CentralInventoryWithRoutings {
  return {
    ...mapCentralInventoryItem(record),
    routings: record.routings.map(mapInventoryRouting),
  };
}
