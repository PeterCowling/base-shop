export function createReverseLogisticsEventDelegate() {
  const events: any[] = [];
  return {
    create: async ({ data }: any) => {
      events.push({ ...data });
      return data;
    },
    findMany: async ({ where }: any = {}) =>
      events.filter((e) =>
        Object.entries(where).every(([k, v]) => e[k] === v),
      ),
  } as any;
}
