type CartLifecycle = {
  id: string;
  cartId: string;
  shopId: string;
  status: string;
  checkoutSessionId?: string | null;
  orderId?: string | null;
  clearedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

let counter = 0;
function generateId() {
  return `clc_${++counter}`;
}

export function createCartLifecycleDelegate() {
  const rows = new Map<string, CartLifecycle>();

  function getKey(shopId: string, cartId: string): string {
    return `${shopId}:${cartId}`;
  }

  return {
    async findUnique({
      where,
    }: {
      where: { shopId_cartId: { shopId: string; cartId: string } };
    }) {
      const key = getKey(where.shopId_cartId.shopId, where.shopId_cartId.cartId);
      const row = rows.get(key);
      return row ? { ...row } : null;
    },

    async upsert({
      where,
      create,
      update,
    }: {
      where: { shopId_cartId: { shopId: string; cartId: string } };
      create: Omit<CartLifecycle, "id" | "createdAt" | "updatedAt">;
      update: Partial<Omit<CartLifecycle, "id" | "createdAt" | "updatedAt">>;
    }) {
      const key = getKey(where.shopId_cartId.shopId, where.shopId_cartId.cartId);
      const existing = rows.get(key);
      const now = new Date();

      if (existing) {
        const next: CartLifecycle = {
          ...existing,
          ...update,
          updatedAt: now,
        };
        rows.set(key, next);
        return { ...next };
      }

      const created: CartLifecycle = {
        id: generateId(),
        ...create,
        createdAt: now,
        updatedAt: now,
      };
      rows.set(key, created);
      return { ...created };
    },

    async update({
      where,
      data,
    }: {
      where: { shopId_cartId: { shopId: string; cartId: string } };
      data: Partial<Omit<CartLifecycle, "id" | "createdAt" | "updatedAt">>;
    }) {
      const key = getKey(where.shopId_cartId.shopId, where.shopId_cartId.cartId);
      const existing = rows.get(key);
      if (!existing) return null;

      const now = new Date();
      const next: CartLifecycle = {
        ...existing,
        ...data,
        updatedAt: now,
      };
      rows.set(key, next);
      return { ...next };
    },

    async delete({
      where,
    }: {
      where: { shopId_cartId: { shopId: string; cartId: string } };
    }) {
      const key = getKey(where.shopId_cartId.shopId, where.shopId_cartId.cartId);
      const existing = rows.get(key);
      if (!existing) return null;
      rows.delete(key);
      return { ...existing };
    },

    async findMany({
      where,
    }: {
      where?: {
        shopId?: string;
        status?: string;
      };
    } = {}) {
      const result: CartLifecycle[] = [];
      for (const row of rows.values()) {
        if (where?.shopId && row.shopId !== where.shopId) continue;
        if (where?.status && row.status !== where.status) continue;
        result.push({ ...row });
      }
      return result;
    },

    // Test-only helper to clear all data
    __clear() {
      rows.clear();
      counter = 0;
    },
  };
}
