import type { SubscriptionUsage } from "@acme/types";

type SubscriptionUsageWhere = Partial<SubscriptionUsage>;

interface UpsertArgs {
  where: SubscriptionUsageWhere;
  update: Partial<SubscriptionUsage>;
  create: SubscriptionUsage;
}

export function createSubscriptionUsageDelegate() {
  const usages: SubscriptionUsage[] = [];
  const findIdx = (where: SubscriptionUsageWhere) =>
    usages.findIndex((u) =>
      Object.entries(where).every(
        ([k, v]) => u[k as keyof SubscriptionUsage] === v,
      ),
    );
  return {
    async findUnique({ where }: { where: SubscriptionUsageWhere }) {
      const idx = findIdx(where);
      return idx >= 0 ? usages[idx] : null;
    },
    async upsert({ where, update, create }: UpsertArgs) {
      const idx = findIdx(where);
      if (idx >= 0) {
        usages[idx] = { ...usages[idx], ...update };
        return usages[idx];
      }
      const record: SubscriptionUsage = { ...create };
      usages.push(record);
      return record;
    },
  };
}
