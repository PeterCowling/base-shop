type StripeWebhookEvent = {
  id: string;
  shop: string;
  type: string;
  status: string;
  lastError?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export function createStripeWebhookEventDelegate() {
  const rows = new Map<string, StripeWebhookEvent>();

  return {
    async findUnique({ where }: { where: { id: string } }) {
      const row = rows.get(where.id);
      return row ? { ...row } : null;
    },

    async upsert({
      where,
      create,
      update,
    }: {
      where: { id: string };
      create: StripeWebhookEvent;
      update: Partial<StripeWebhookEvent>;
    }) {
      const existing = rows.get(where.id);
      const now = new Date();
      if (existing) {
        const next: StripeWebhookEvent = {
          ...existing,
          ...update,
          updatedAt: now,
        };
        rows.set(where.id, next);
        return { ...next };
      }

      const created: StripeWebhookEvent = {
        ...create,
        createdAt: create.createdAt ?? now,
        updatedAt: create.updatedAt ?? now,
      };
      rows.set(where.id, created);
      return { ...created };
    },

    async deleteMany({
      where,
    }: {
      where?: { createdAt?: { lt?: Date } };
    } = {}) {
      const cutoff = where?.createdAt?.lt;
      if (!cutoff) return { count: 0 };
      let count = 0;
      for (const [id, row] of rows.entries()) {
        const createdAt = row.createdAt ?? row.updatedAt ?? new Date();
        if (createdAt.getTime() < cutoff.getTime()) {
          rows.delete(id);
          count += 1;
        }
      }
      return { count };
    },
  };
}

