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
    async findUnique({ where: { id } }: { where: { id: string } }) {
      const row = holds.get(id);
      return row ? { ...row } : null;
    },
    async findMany({
      where,
      take,
      orderBy,
    }: {
      where: { shopId: string; status: HoldStatus; expiresAt: { lte: Date } };
      select: { id: true };
      orderBy: { expiresAt: "asc" };
      take: number;
    }) {
      const filtered = Array.from(holds.values()).filter((h) => {
        if (h.shopId !== where.shopId) return false;
        if (h.status !== where.status) return false;
        if (h.expiresAt > where.expiresAt.lte) return false;
        return true;
      });
      if (orderBy.expiresAt === "asc") {
        filtered.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
      }
      return filtered.slice(0, take).map((h) => ({ id: h.id }));
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

