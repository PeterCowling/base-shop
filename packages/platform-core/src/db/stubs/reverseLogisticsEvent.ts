export function createReverseLogisticsEventDelegate() {
  const events: any[] = [];
  return {
    create: async ({ data }: any) => {
      events.push({ ...data });
      return data;
    },
    createMany: async ({ data }: any) => {
      events.push(...data.map((e: any) => ({ ...e })));
      return { count: data.length };
    },
    findMany: async ({ where }: any = {}) =>
      events.filter((e) =>
        Object.entries(where).every(([k, v]) => e[k] === v),
      ),
  } as any;
}
