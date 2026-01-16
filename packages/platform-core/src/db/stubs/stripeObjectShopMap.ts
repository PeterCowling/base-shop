type StripeObjectShopMap = {
  id: string;
  environment: string;
  objectType: string;
  stripeId: string;
  shopId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type WhereUnique = {
  environment_objectType_stripeId?: {
    environment: string;
    objectType: string;
    stripeId: string;
  };
};

export function createStripeObjectShopMapDelegate() {
  const rows = new Map<string, StripeObjectShopMap>();

  function keyOf(where: WhereUnique): string | null {
    const k = where.environment_objectType_stripeId;
    if (!k) return null;
    return `${k.environment}:${k.objectType}:${k.stripeId}`;
  }

  return {
    async findUnique({ where }: { where: WhereUnique }) {
      const key = keyOf(where);
      if (!key) return null;
      const row = rows.get(key);
      return row ? { ...row } : null;
    },

    async upsert({
      where,
      create,
      update,
    }: {
      where: WhereUnique;
      create: StripeObjectShopMap;
      update: Partial<StripeObjectShopMap>;
    }) {
      const key = keyOf(where);
      if (!key) throw new Error("Missing unique key"); // i18n-exempt: test-only stub error

      const existing = rows.get(key);
      const now = new Date();
      if (existing) {
        const next: StripeObjectShopMap = {
          ...existing,
          ...update,
          updatedAt: now,
        };
        rows.set(key, next);
        return { ...next };
      }

      const created: StripeObjectShopMap = {
        ...create,
        createdAt: create.createdAt ?? now,
        updatedAt: create.updatedAt ?? now,
      };
      rows.set(key, created);
      return { ...created };
    },
  };
}

