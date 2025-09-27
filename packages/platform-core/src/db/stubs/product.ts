export type Product = { shopId: string; id?: string; [key: string]: unknown };

interface ProductDelegate {
  findMany(args: { where: { shopId: string } }): Promise<Product[]>;
  deleteMany(args: { where: { shopId: string } }): Promise<{ count: number }>;
  createMany(args: { data: Product[] }): Promise<{ count: number }>;
  findUnique(args: { where: { shopId_id: { shopId: string; id: string } } }): Promise<Product | null>;
  update(args: {
    where: { shopId_id: { shopId: string; id: string } };
    data: Partial<Product>;
  }): Promise<Product>;
  delete(args: { where: { shopId_id: { shopId: string; id: string } } }): Promise<Product>;
  create(args: { data: Product }): Promise<Product>;
}

export function createProductDelegate(): ProductDelegate {
  const products: Product[] = [];
  return {
    async findMany({ where: { shopId } }) {
      return products.filter((p) => p.shopId === shopId);
    },
    async deleteMany({ where: { shopId } }) {
      let count = 0;
      for (let i = products.length - 1; i >= 0; i--) {
        if (products[i].shopId === shopId) {
          products.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    async createMany({ data }) {
      products.push(...data.map((d) => ({ ...d })));
      return { count: data.length };
    },
    async findUnique({ where }) {
      if (where?.shopId_id) {
        const { shopId, id } = where.shopId_id;
        return products.find((p) => p.shopId === shopId && p.id === id) || null;
      }
      return null;
    },
    async update({ where: { shopId_id }, data }) {
      const idx = products.findIndex(
        (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
      );
      if (idx < 0) throw new Error("Product not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      products[idx] = { ...products[idx], ...data };
      return products[idx];
    },
    async delete({ where: { shopId_id } }) {
      const idx = products.findIndex(
        (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
      );
      if (idx < 0) throw new Error("Product not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      const [removed] = products.splice(idx, 1);
      return removed;
    },
    async create({ data }) {
      products.push({ ...data });
      return data;
    },
  } satisfies ProductDelegate;
}
