export type HoldStatus = "active" | "committed" | "released" | "expired";

export type InventoryHoldRow = {
  id: string;
  shopId: string;
  status: HoldStatus;
  expiresAt: Date;
};

export type InventoryHoldItemRow = {
  holdId: string;
  shopId: string;
  sku: string;
  productId: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  quantity: number;
};

export type InventoryItemRow = {
  shopId: string;
  sku: string;
  productId: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  quantity: number;
};

export type InventoryHoldDb = {
  inventoryHold: {
    findUnique(args: { where: { id: string } }): Promise<InventoryHoldRow | null>;
    findMany(args: {
      where: { shopId: string; status: HoldStatus; expiresAt: { lte: Date } };
      select: { id: true };
      orderBy: { expiresAt: "asc" };
      take: number;
    }): Promise<Array<{ id: string }>>;
    create(args: { data: InventoryHoldRow & { createdAt?: Date } }): Promise<InventoryHoldRow>;
    updateMany(args: {
      where: { id: string; shopId: string; status: HoldStatus };
      data: Partial<{
        status: HoldStatus;
        expiresAt: Date;
        committedAt: Date | null;
        releasedAt: Date | null;
        expiredAt: Date | null;
      }>;
    }): Promise<{ count: number }>;
  };
  inventoryHoldItem: {
    createMany(args: { data: InventoryHoldItemRow[] }): Promise<{ count: number }>;
    findMany(args: { where: { holdId: string } }): Promise<InventoryHoldItemRow[]>;
  };
  inventoryItem?: {
    findUnique(args: {
      where: { shopId_sku_variantKey: { shopId: string; sku: string; variantKey: string } };
    }): Promise<InventoryItemRow | null>;
    updateMany(args: {
      where: {
        shopId: string;
        sku: string;
        variantKey: string;
        quantity?: { gte: number };
      };
      data: { quantity: { decrement?: number; increment?: number; set?: number } };
    }): Promise<{ count: number }>;
    upsert(args: {
      where: { shopId_sku_variantKey: { shopId: string; sku: string; variantKey: string } };
      create: InventoryItemRow;
      update: Partial<Omit<InventoryItemRow, "quantity">> & {
        quantity?: { increment?: number; set?: number };
      };
    }): Promise<InventoryItemRow>;
  };
  $executeRawUnsafe?: (query: string) => Promise<unknown>;
  $transaction<T>(fn: (tx: InventoryHoldDb) => Promise<T>): Promise<T>;
};
