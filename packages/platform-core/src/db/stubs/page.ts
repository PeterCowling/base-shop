export function createPageDelegate() {
  const pages: any[] = [];
  const match = (obj: any, where: any = {}) =>
    Object.entries(where).every(([k, v]) => obj[k] === v);
  return {
    createMany: async ({ data }: any) => {
      pages.push(...data.map((d: any) => ({ ...d })));
      return { count: data.length };
    },
    findMany: async ({ where }: any = {}) => pages.filter((p) => match(p, where)),
    update: async ({ where, data }: any) => {
      const idx = pages.findIndex((p) => match(p, where));
      if (idx < 0) throw new Error("Page not found");
      pages[idx] = { ...pages[idx], ...data };
      return pages[idx];
    },
    deleteMany: async ({ where }: any) => {
      let count = 0;
      for (let i = pages.length - 1; i >= 0; i--) {
        if (match(pages[i], where)) {
          pages.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    upsert: async ({ where, update, create }: any) => {
      const idx = pages.findIndex((p) => match(p, where));
      if (idx >= 0) {
        pages[idx] = { ...pages[idx], ...update };
        return pages[idx];
      }
      const record = { ...create };
      pages.push(record);
      return record;
    },
  } as any;
}
