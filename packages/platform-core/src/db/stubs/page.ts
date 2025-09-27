export type PageRecord = Record<string, unknown>;
type Where = Partial<PageRecord>;

interface PageDelegate {
  createMany(args: { data: PageRecord[] }): Promise<{ count: number }>;
  findMany(args?: { where?: Where }): Promise<PageRecord[]>;
  update(args: { where: Where; data: Partial<PageRecord> }): Promise<PageRecord>;
  deleteMany(args: { where: Where }): Promise<{ count: number }>;
  upsert(args: {
    where: Where;
    update: Partial<PageRecord>;
    create: PageRecord;
  }): Promise<PageRecord>;
}

export function createPageDelegate(): PageDelegate {
  const pages: PageRecord[] = [];
  const match = (obj: PageRecord, where: Where = {}) =>
    Object.entries(where).every(([k, v]) => obj[k] === v);
  return {
    async createMany({ data }) {
      pages.push(...data.map((d) => ({ ...d })));
      return { count: data.length };
    },
    async findMany({ where }: { where?: Where } = {}) {
      return pages.filter((p) => match(p, where));
    },
    async update({ where, data }) {
      const idx = pages.findIndex((p) => match(p, where));
      if (idx < 0) throw new Error("Page not found"); // i18n-exempt -- DS-0001 Internal error message, not UI copy
      pages[idx] = { ...pages[idx], ...data };
      return pages[idx];
    },
    async deleteMany({ where }) {
      let count = 0;
      for (let i = pages.length - 1; i >= 0; i--) {
        if (match(pages[i], where)) {
          pages.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    async upsert({ where, update, create }) {
      const idx = pages.findIndex((p) => match(p, where));
      if (idx >= 0) {
        pages[idx] = { ...pages[idx], ...update };
        return pages[idx];
      }
      const record = { ...create };
      pages.push(record);
      return record;
    },
  } satisfies PageDelegate;
}

// Instantiate a default delegate instance for convenience in tests
export const pageDelegate = createPageDelegate();
