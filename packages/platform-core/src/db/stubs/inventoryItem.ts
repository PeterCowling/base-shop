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
  findUnique(args: { where: { shopId_sku_variantKey: ShopSkuVariantKey } }): Promise<InventoryItemRecord | null>;
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
    findUnique: async ({ where: { shopId_sku_variantKey } }) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      return (
        inventoryItems.find(
          (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
        ) || null
      );
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
        inventoryItems[idx] = { ...inventoryItems[idx], ...update };
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
