export function createSubscriptionUsageDelegate() {
  const usages: any[] = [];
  const findIdx = (where: any) =>
    usages.findIndex((u) => Object.entries(where).every(([k, v]) => u[k] === v));
  return {
    findUnique: async ({ where }: any) => {
      const idx = findIdx(where);
      return idx >= 0 ? usages[idx] : null;
    },
    upsert: async ({ where, update, create }: any) => {
      const idx = findIdx(where);
      if (idx >= 0) {
        usages[idx] = { ...usages[idx], ...update };
        return usages[idx];
      }
      const record = { ...create };
      usages.push(record);
      return record;
    },
  } as any;
}
