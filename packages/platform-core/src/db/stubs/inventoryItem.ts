export interface InventoryItemRecord {
  shopId: string;
  sku: string;
  variantKey: string;
  [key: string]: unknown;
}

type ShopSkuVariantKey = {
  shopId: string;
  sku: string;
  variantKey: string;
};

export type InventoryItemDelegate = {
  findMany(args: { where: { shopId: string } }): Promise<InventoryItemRecord[]>;
  deleteMany(args: { where: { shopId: string } }): Promise<{ count: number }>;
  createMany(args: { data: InventoryItemRecord[] }): Promise<{ count: number }>;
  updateMany(args: { where: Record<string, unknown>; data: Partial<InventoryItemRecord> }): Promise<{ count: number }>;
  findUnique(args: { where: { shopId_sku_variantKey: ShopSkuVariantKey } }): Promise<InventoryItemRecord | null>;
  update(args: {
    where: { shopId_sku_variantKey: ShopSkuVariantKey };
    data: Partial<InventoryItemRecord>;
  }): Promise<InventoryItemRecord>;
  delete(args: { where: { shopId_sku_variantKey: ShopSkuVariantKey } }): Promise<InventoryItemRecord>;
  upsert(args: {
    where: { shopId_sku_variantKey: ShopSkuVariantKey };
    update: Partial<InventoryItemRecord>;
    create: Partial<InventoryItemRecord>;
  }): Promise<InventoryItemRecord>;
};

export function createInventoryItemDelegate(): InventoryItemDelegate {
  const inventoryItems: InventoryItemRecord[] = [];
  return {
    findMany: async ({ where: { shopId } }) =>
      inventoryItems.filter((i) => i.shopId === shopId),
    deleteMany: async ({ where: { shopId } }) => {
      let count = 0;
      for (let i = inventoryItems.length - 1; i >= 0; i--) {
        if (inventoryItems[i].shopId === shopId) {
          inventoryItems.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    createMany: async ({ data }) => {
      inventoryItems.push(...data.map((item) => ({ ...item })));
      return { count: data.length };
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      for (const item of inventoryItems) {
        let matches = true;
        for (const [key, value] of Object.entries(where)) {
          // Handle Prisma operators like { gte: number }
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const operators = value as Record<string, unknown>;
            if ('gte' in operators) {
              const itemValue = typeof item[key] === 'number' ? item[key] : 0;
              const compareValue = typeof operators.gte === 'number' ? operators.gte : 0;
              if (itemValue < compareValue) {
                matches = false;
                break;
              }
            }
            // Add other operators as needed (gt, lt, lte, etc.)
          } else if (item[key] !== value) {
            matches = false;
            break;
          }
        }
        if (matches) {
          // Handle Prisma operations like { increment: number } or { decrement: number }
          const updates: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              const operations = value as Record<string, unknown>;
              if ('increment' in operations) {
                const currentValue = typeof item[key] === 'number' ? item[key] : 0;
                const incrementBy = typeof operations.increment === 'number' ? operations.increment : 0;
                updates[key] = currentValue + incrementBy;
              } else if ('decrement' in operations) {
                const currentValue = typeof item[key] === 'number' ? item[key] : 0;
                const decrementBy = typeof operations.decrement === 'number' ? operations.decrement : 0;
                updates[key] = currentValue - decrementBy;
              } else {
                updates[key] = value;
              }
            } else {
              updates[key] = value;
            }
          }
          Object.assign(item, updates);
          count++;
        }
      }
      return { count };
    },
    findUnique: async ({ where: { shopId_sku_variantKey } }) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      return (
        inventoryItems.find(
          (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
        ) || null
      );
    },
    update: async ({ where: { shopId_sku_variantKey }, data }) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      const idx = inventoryItems.findIndex(
        (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
      );
      if (idx < 0) throw new Error("InventoryItem not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      inventoryItems[idx] = { ...inventoryItems[idx], ...data };
      return inventoryItems[idx];
    },
    delete: async ({ where: { shopId_sku_variantKey } }) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      const idx = inventoryItems.findIndex(
        (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
      );
      if (idx < 0) throw new Error("InventoryItem not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      const [removed] = inventoryItems.splice(idx, 1);
      return removed;
    },
    upsert: async ({ where: { shopId_sku_variantKey }, update, create }) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      const idx = inventoryItems.findIndex(
        (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
      );
      if (idx >= 0) {
        // Handle Prisma operations like { increment: number } or { decrement: number } in update
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(update)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const operations = value as Record<string, unknown>;
            if ('increment' in operations) {
              const currentValue = typeof inventoryItems[idx][key] === 'number' ? inventoryItems[idx][key] : 0;
              const incrementBy = typeof operations.increment === 'number' ? operations.increment : 0;
              updates[key] = currentValue + incrementBy;
            } else if ('decrement' in operations) {
              const currentValue = typeof inventoryItems[idx][key] === 'number' ? inventoryItems[idx][key] : 0;
              const decrementBy = typeof operations.decrement === 'number' ? operations.decrement : 0;
              updates[key] = currentValue - decrementBy;
            } else {
              updates[key] = value;
            }
          } else {
            updates[key] = value;
          }
        }
        inventoryItems[idx] = { ...inventoryItems[idx], ...updates };
        return inventoryItems[idx];
      }
      const record: InventoryItemRecord = {
        shopId,
        sku,
        variantKey,
        ...create,
      };
      inventoryItems.push(record);
      return record;
    },
  };
}
