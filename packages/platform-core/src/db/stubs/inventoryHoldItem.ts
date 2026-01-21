type InventoryHoldItem = {
  holdId: string;
  shopId: string;
  sku: string;
  productId: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  quantity: number;
};

export function createInventoryHoldItemDelegate() {
  const items: InventoryHoldItem[] = [];

  return {
    async createMany({ data }: { data: InventoryHoldItem[] }) {
      items.push(...data.map((row) => ({ ...row })));
      return { count: data.length };
    },
    async findMany({ where: { holdId } }: { where: { holdId: string } }) {
      return items.filter((i) => i.holdId === holdId).map((i) => ({ ...i }));
    },
  };
}

