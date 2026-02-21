import type { HoldStatus } from "../../inventoryHolds.db";

type InventoryHold = {
  id: string;
  shopId: string;
  status: HoldStatus;
  expiresAt: Date;
  committedAt?: Date | null;
  releasedAt?: Date | null;
  expiredAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export function createInventoryHoldDelegate() {
  const holds = new Map<string, InventoryHold>();

  return {
    async findUnique({ where }: { where: { id?: string; shopId_holdId?: { shopId: string; holdId: string } } }) {
      const id = where.id ?? where.shopId_holdId?.holdId;
      if (!id) return null;
      const row = holds.get(id);
      // If querying by composite key, also check shopId matches
      if (where.shopId_holdId && row && row.shopId !== where.shopId_holdId.shopId) {
        return null;
      }
      return row ? { ...row } : null;
    },
    async findMany({
      where,
      take,
      orderBy,
      select,
    }: {
      where: { shopId?: string; status?: HoldStatus; expiresAt?: { lte?: Date; lt?: Date } };
      select?: { id: true };
      orderBy?: { expiresAt?: "asc" };
      take?: number;
    }) {
      const filtered = Array.from(holds.values()).filter((h) => {
        if (where.shopId && h.shopId !== where.shopId) return false;
        if (where.status && h.status !== where.status) return false;
        if (where.expiresAt?.lte && h.expiresAt > where.expiresAt.lte) return false;
        if (where.expiresAt?.lt && h.expiresAt >= where.expiresAt.lt) return false;
        return true;
      });
      if (orderBy?.expiresAt === "asc") {
        filtered.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
      }
      const results = filtered.slice(0, take);
      // Return all fields if no select specified, otherwise only selected fields
      if (select) {
        return results.map((h) => ({ id: h.id }));
      }
      // Return shopId and holdId for the service
      return results.map((h) => ({ shopId: h.shopId, holdId: h.id })) as unknown as InventoryHold[];
    },
    async create({ data }: { data: InventoryHold }) {
      if (holds.has(data.id)) {
        throw new Error("InventoryHold already exists"); // i18n-exempt -- test-only stub error
      }
      const now = new Date();
      const row: InventoryHold = {
        ...data,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      holds.set(row.id, row);
      return { ...row };
    },
    async updateMany({
      where,
      data,
    }: {
      where: { id: string; shopId: string; status: HoldStatus };
      data: Partial<InventoryHold>;
    }) {
      const existing = holds.get(where.id);
      if (!existing) return { count: 0 };
      if (existing.shopId !== where.shopId) return { count: 0 };
      if (existing.status !== where.status) return { count: 0 };
      const next: InventoryHold = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      } as InventoryHold;
      holds.set(where.id, next);
      return { count: 1 };
    },
  };
}

