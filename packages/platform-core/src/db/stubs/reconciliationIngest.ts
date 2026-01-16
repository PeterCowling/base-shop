type ReconciliationIngest = {
  id?: string;
  shop: string;
  sessionId: string;
  source: string;
  requestId?: string | null;
  currency: string;
  amountTotalMinor: number;
  normalizationApplied?: boolean;
  payload: unknown;
  createdAt?: Date;
};

export function createReconciliationIngestDelegate() {
  const rows: ReconciliationIngest[] = [];
  let nextId = 0;

  return {
    async create({ data }: { data: ReconciliationIngest }) {
      const createdRow: ReconciliationIngest = {
        ...data,
        id: data.id ?? `reconciliation_ingest_${(nextId += 1)}`,
        createdAt: data.createdAt ?? new Date(),
        normalizationApplied: data.normalizationApplied ?? false,
      };
      rows.push(createdRow);
      return { ...createdRow };
    },
    async findMany({ where }: { where?: Partial<ReconciliationIngest> } = {}) {
      if (!where) return rows.map((r) => ({ ...r }));
      return rows
        .filter((r) => {
          for (const [k, v] of Object.entries(where)) {
            if ((r as Record<string, unknown>)[k] !== v) return false;
          }
          return true;
        })
        .map((r) => ({ ...r }));
    },
  };
}

