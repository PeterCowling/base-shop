import { loadCoreEnv } from "@acme/config/env/core";
import { createRequire } from "module";
import type { PrismaClient } from "./prisma-client";
import type {
  Shop,
  Page,
  RentalOrder,
  SubscriptionUsage,
  CustomerProfile,
  User,
  ReverseLogisticsEvent,
} from "@acme/types";

// Avoid referencing conditional exports from "@prisma/client" directly.
type PrismaClientCtor = new (...args: unknown[]) => PrismaClient;

const coreEnv = loadCoreEnv();

export interface StubPrismaClient extends PrismaClient {
  reverseLogisticsEvent: {
    create(args: { data: Omit<ReverseLogisticsEvent, "id"> }): Promise<ReverseLogisticsEvent>;
    findMany(args: {
      where?: Partial<ReverseLogisticsEvent>;
      orderBy?: { createdAt: "asc" | "desc" };
    }): Promise<ReverseLogisticsEvent[]>;
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function matchesWhere(rec: Record<string, any>, where?: Record<string, any>): boolean {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (key === "NOT" && typeof val === "object" && val) {
      for (const [nKey, nVal] of Object.entries(val as Record<string, any>)) {
        if ((rec as any)[nKey] === nVal) return false;
      }
      continue;
    }
    if (val && typeof val === "object" && "gt" in val) {
      if (!((rec as any)[key] > (val as { gt: any }).gt)) return false;
      continue;
    }
    if ((rec as any)[key] !== val) return false;
  }
  return true;
}

function applyUpdate(rec: Record<string, any>, data: Record<string, any>): void {
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object" && "increment" in val) {
      rec[key] = (rec[key] ?? 0) + (val as { increment: number }).increment;
    } else {
      rec[key] = val;
    }
  }
}

function deleteMatching(arr: Record<string, any>[], where?: Record<string, any>): number {
  const before = arr.length;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (matchesWhere(arr[i], where)) arr.splice(i, 1);
  }
  return before - arr.length;
}

/* -------------------------------------------------------------------------- */
/* Stub Implementation                                                        */
/* -------------------------------------------------------------------------- */

const shops: { id: string; data: Shop }[] = [];
const pages: Array<{ id: string; shopId: string; slug: string; data: Page }> = [];
const rentalOrders: RentalOrder[] = [];
const subscriptionUsages: SubscriptionUsage[] = [];
const customerProfiles: CustomerProfile[] = [];
const users: User[] = [];
const reverseLogisticsEvents: ReverseLogisticsEvent[] = [];

function resetStubPrisma(): void {
  shops.length = 0;
  pages.length = 0;
  rentalOrders.length = 0;
  subscriptionUsages.length = 0;
  customerProfiles.length = 0;
  users.length = 0;
  reverseLogisticsEvents.length = 0;
}

function createStubPrisma(): StubPrismaClient {

  const findRentalByUnique = (
    where:
      | { shop_sessionId: { shop: string; sessionId: string } }
      | { shop_trackingNumber: { shop: string; trackingNumber: string } },
  ) => {
    if ("shop_sessionId" in where) {
      const { shop, sessionId } = where.shop_sessionId;
      return rentalOrders.find(
        (o) => o.shop === shop && o.sessionId === sessionId,
      );
    }
    const { shop, trackingNumber } = where.shop_trackingNumber;
    return rentalOrders.find(
      (o) => o.shop === shop && o.trackingNumber === trackingNumber,
    );
  };

  return {
    rentalOrder: {
      findMany: async ({ where }: { where?: { shop?: string; customerId?: string } }) =>
        rentalOrders.filter((o) => matchesWhere(o, where)),
      findFirst: async ({ where }: { where?: Partial<RentalOrder> }) =>
        rentalOrders.find((o) => matchesWhere(o, where)) ?? null,
      findUnique: async ({
        where,
      }: {
        where:
          | { shop_sessionId: { shop: string; sessionId: string } }
          | { shop_trackingNumber: { shop: string; trackingNumber: string } };
      }) => findRentalByUnique(where) ?? null,
      create: async ({ data }: { data: RentalOrder }) => {
        rentalOrders.push({ ...data });
        return data;
      },
      createMany: async ({ data }: { data: RentalOrder[] }) => {
        data.forEach((d) => rentalOrders.push({ ...d }));
        return { count: data.length };
      },
      update: async ({ where, data }: { where: any; data: Partial<RentalOrder> }) => {
        const order = findRentalByUnique(where);
        if (!order) throw new Error("Order not found");
        applyUpdate(order as any, data as any);
        return order;
      },
      deleteMany: async ({ where }: { where?: Partial<RentalOrder> }) => ({
        count: deleteMatching(rentalOrders as any, where as any),
      }),
      upsert: async ({ where, create, update }: { where: any; create: RentalOrder; update: Partial<RentalOrder> }) => {
        const existing = findRentalByUnique(where);
        if (existing) {
          applyUpdate(existing as any, update as any);
          return existing;
        }
        const rec = { ...create };
        rentalOrders.push(rec);
        return rec;
      },
    },

    shop: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        shops.find((s) => s.id === where.id) ?? null,
      findMany: async ({ where }: { where?: { id?: string } }) =>
        shops.filter((s) => matchesWhere(s, where)),
      create: async ({ data }: { data: { id: string; data: Shop } }) => {
        shops.push({ ...data });
        return data;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: { id: string; data: Shop };
        update: { data: Shop };
      }) => {
        let rec = shops.find((s) => s.id === where.id);
        if (rec) {
          applyUpdate(rec as any, update as any);
          return rec;
        }
        rec = { ...create };
        shops.push(rec);
        return rec;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const idx = shops.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error("Shop not found");
        const [rec] = shops.splice(idx, 1);
        return rec;
      },
    },

    page: {
      findMany: async ({ where }: { where?: { shopId?: string; id?: string; slug?: string } }) =>
        pages.filter((p) => matchesWhere(p, where)),
      findUnique: async ({ where }: { where: { id: string } }) =>
        pages.find((p) => p.id === where.id) ?? null,
      createMany: async ({ data }: { data: Array<{ shopId: string; slug: string; data: Page }> }) => {
        data.forEach((d) => pages.push({ id: String(pages.length + 1), ...d }));
        return { count: data.length };
      },
      upsert: async ({ where, create, update }: { where: { id: string }; create: any; update: any }) => {
        const existing = pages.find((p) => p.id === where.id);
        if (existing) {
          applyUpdate(existing as any, update as any);
          return existing;
        }
        const rec = { ...create } as { id: string; shopId: string; slug: string; data: Page };
        pages.push(rec);
        return rec;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const rec = pages.find((p) => p.id === where.id);
        if (!rec) throw new Error("Page not found");
        applyUpdate(rec as any, data as any);
        return rec;
      },
      deleteMany: async ({ where }: { where?: Partial<{ id: string; shopId: string }> }) => ({
        count: deleteMatching(pages as any, where as any),
      }),
    },

    customerProfile: {
      findUnique: async ({ where }: { where: { customerId: string } }) =>
        customerProfiles.find((p) => p.customerId === where.customerId) ?? null,
      findFirst: async ({ where }: { where?: Partial<CustomerProfile> }) =>
        customerProfiles.find((p) => matchesWhere(p, where)) ?? null,
      upsert: async ({ where, create, update }: { where: { customerId: string }; create: CustomerProfile; update: Partial<CustomerProfile> }) => {
        let rec = customerProfiles.find((p) => p.customerId === where.customerId);
        if (rec) {
          applyUpdate(rec as any, update as any);
          return rec;
        }
        rec = { ...create };
        customerProfiles.push(rec);
        return rec;
      },
    },

    subscriptionUsage: {
      findUnique: async ({
        where,
      }: {
        where: { shop_customerId_month: { shop: string; customerId: string; month: string } };
      }) => {
        const w = where.shop_customerId_month;
        return (
          subscriptionUsages.find(
            (r) => r.shop === w.shop && r.customerId === w.customerId && r.month === w.month,
          ) ?? null
        );
      },
      upsert: async ({ where, create, update }: { where: any; create: SubscriptionUsage; update: Partial<SubscriptionUsage> }) => {
        const w = where.shop_customerId_month;
        let rec = subscriptionUsages.find(
          (r) => r.shop === w.shop && r.customerId === w.customerId && r.month === w.month,
        );
        if (rec) {
          applyUpdate(rec as any, update as any);
          return rec;
        }
        rec = { ...create };
        subscriptionUsages.push(rec);
        return rec;
      },
    },

    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        return null;
      },
      findMany: async ({ where }: { where?: Partial<User> }) =>
        users.filter((u) => matchesWhere(u, where)),
      findFirst: async ({ where }: { where?: Partial<User> }) =>
        users.find((u) => matchesWhere(u, where)) ?? null,
      create: async ({ data }: { data: User }) => {
        users.push({ ...data });
        return data;
      },
      update: async ({ where, data }: { where: { id?: string; email?: string }; data: Partial<User> }) => {
        const rec = users.find((u) =>
          where.id ? u.id === where.id : where.email ? u.email === where.email : false,
        );
        if (!rec) throw new Error("User not found");
        applyUpdate(rec as any, data as any);
        return rec;
      },
      deleteMany: async ({ where }: { where?: Partial<User> }) => ({
        count: deleteMatching(users as any, where as any),
      }),
    },

    reverseLogisticsEvent: {
      create: async ({ data }: { data: Omit<ReverseLogisticsEvent, "id"> }) => {
        const rec: ReverseLogisticsEvent = {
          ...data,
          id: String(reverseLogisticsEvents.length + 1),
        };
        reverseLogisticsEvents.push(rec);
        return rec;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: Partial<ReverseLogisticsEvent>;
        orderBy?: { createdAt: "asc" | "desc" };
      }) => {
        let res = reverseLogisticsEvents.filter((e) => matchesWhere(e, where));
        if (orderBy?.createdAt === "asc")
          res = res.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        else if (orderBy?.createdAt === "desc")
          res = res.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return res;
      },
    },
  } as StubPrismaClient;
}

let prisma: StubPrismaClient;

if (
  process.env.NODE_ENV === "test" ||
  !coreEnv.DATABASE_URL ||
  process.env.USE_STUB_PRISMA
) {
  // In tests (or when no database URL is provided) fall back to an in-memory stub
  prisma = createStubPrisma();
} else {
  try {
    const requirePrisma = createRequire(
      typeof __dirname !== "undefined"
        ? __dirname
        : `${process.cwd()}/package.json`
    );
    const mod = requirePrisma("@prisma/client") as {
      PrismaClient?: PrismaClientCtor;
      default?: { PrismaClient?: PrismaClientCtor };
    };
    const PrismaClientCtor: PrismaClientCtor | undefined =
      mod.PrismaClient ?? mod.default?.PrismaClient;
    if (!PrismaClientCtor) {
      prisma = createStubPrisma();
    } else {
      const databaseUrl = coreEnv.DATABASE_URL;
      prisma = new PrismaClientCtor({
        datasources: { db: { url: databaseUrl } },
      }) as unknown as StubPrismaClient;
    }
  } catch {
    // If Prisma client cannot be loaded, fall back to the in-memory stub
    prisma = createStubPrisma();
  }
}

export { prisma, resetStubPrisma };
