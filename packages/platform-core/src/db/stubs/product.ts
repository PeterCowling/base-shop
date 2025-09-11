export function createProductDelegate() {
  const products: { shopId: string; [key: string]: any }[] = [];
  return {
    findMany: async ({ where: { shopId } }: any) =>
      products.filter((p) => p.shopId === shopId),
    deleteMany: async ({ where: { shopId } }: any) => {
      let count = 0;
      for (let i = products.length - 1; i >= 0; i--) {
        if (products[i].shopId === shopId) {
          products.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    createMany: async ({ data }: any) => {
      products.push(...data.map((d: any) => ({ ...d })));
      return { count: data.length };
    },
    findUnique: async ({ where }: any) => {
      if (where?.shopId_id) {
        const { shopId, id } = where.shopId_id;
        return products.find((p) => p.shopId === shopId && p.id === id) || null;
      }
      return null;
    },
    update: async ({ where: { shopId_id }, data }: any) => {
      const idx = products.findIndex(
        (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
      );
      if (idx < 0) throw new Error("Product not found");
      products[idx] = { ...products[idx], ...data };
      return products[idx];
    },
    delete: async ({ where: { shopId_id } }: any) => {
      const idx = products.findIndex(
        (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
      );
      if (idx < 0) throw new Error("Product not found");
      const [removed] = products.splice(idx, 1);
      return removed;
    },
    create: async ({ data }: any) => {
      products.push({ ...data });
      return data;
    },
  } as any;
}
