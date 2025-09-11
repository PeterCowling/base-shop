export type InventoryItemDelegate = {
  findMany(args: any): Promise<any[]>;
  deleteMany(args: any): Promise<{ count: number }>;
  createMany(args: any): Promise<{ count: number }>;
  findUnique(args: any): Promise<any | null>;
  delete(args: any): Promise<any>;
  upsert(args: any): Promise<any>;
};

export function createInventoryItemDelegate(): InventoryItemDelegate {
  const inventoryItems: { shopId: string; [key: string]: any }[] = [];
  return {
    findMany: async ({ where: { shopId } }: any) =>
      inventoryItems.filter((i) => i.shopId === shopId),
    deleteMany: async ({ where: { shopId } }: any) => {
      let count = 0;
      for (let i = inventoryItems.length - 1; i >= 0; i--) {
        if (inventoryItems[i].shopId === shopId) {
          inventoryItems.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    createMany: async ({ data }: any) => {
      inventoryItems.push(...data.map((item: any) => ({ ...item })));
      return { count: data.length };
    },
    findUnique: async ({ where: { shopId_sku_variantKey } }: any) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      return (
        inventoryItems.find(
          (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
        ) || null
      );
    },
    delete: async ({ where: { shopId_sku_variantKey } }: any) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      const idx = inventoryItems.findIndex(
        (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
      );
      if (idx < 0) throw new Error("InventoryItem not found");
      const [removed] = inventoryItems.splice(idx, 1);
      return removed;
    },
    upsert: async ({ where: { shopId_sku_variantKey }, update, create }: any) => {
      const { shopId, sku, variantKey } = shopId_sku_variantKey;
      const idx = inventoryItems.findIndex(
        (i) => i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
      );
      if (idx >= 0) {
        inventoryItems[idx] = { ...inventoryItems[idx], ...update };
        return inventoryItems[idx];
      }
      const record = { ...create };
      inventoryItems.push(record);
      return record;
    },
  };
}
