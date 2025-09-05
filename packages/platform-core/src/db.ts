import { loadCoreEnv } from "@acme/config/env/core";
import { createRequire } from "module";
import type { PrismaClient } from "./prisma-client";

// Avoid referencing conditional exports from "@prisma/client" directly.
type PrismaClientCtor = new (...args: unknown[]) => PrismaClient;

const coreEnv = loadCoreEnv();

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

function createStubPrisma(): PrismaClient {
  const shops: any[] = [];
  const pages: any[] = [];
  const rentalOrders: any[] = [];
  const subscriptionUsages: any[] = [];
  const customerProfiles: any[] = [];
  const users: any[] = [];
  const reverseLogisticsEvents: any[] = [];

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
      findFirst: async ({ where }: { where?: Record<string, any> }) =>
        rentalOrders.find((o) => matchesWhere(o, where)) ?? null,
      findUnique: async ({
        where,
      }: {
        where:
          | { shop_sessionId: { shop: string; sessionId: string } }
          | { shop_trackingNumber: { shop: string; trackingNumber: string } };
      }) => findRentalByUnique(where) ?? null,
      create: async ({ data }: { data: Record<string, any> }) => {
        rentalOrders.push({ ...data });
        return data;
      },
      createMany: async ({ data }: { data: Record<string, any>[] }) => {
        data.forEach((d) => rentalOrders.push({ ...d }));
        return { count: data.length };
      },
      update: async ({
        where,
        data,
      }: {
        where:
          | { shop_sessionId: { shop: string; sessionId: string } }
          | { shop_trackingNumber: { shop: string; trackingNumber: string } };
        data: Record<string, any>;
      }) => {
        const order = findRentalByUnique(where);
        if (!order) throw new Error("Order not found");
        applyUpdate(order, data);
        return order;
      },
      deleteMany: async ({ where }: { where?: Record<string, any> }) => ({
        count: deleteMatching(rentalOrders, where),
      }),
      upsert: async ({
        where,
        create,
        update,
      }: {
        where:
          | { shop_sessionId: { shop: string; sessionId: string } }
          | { shop_trackingNumber: { shop: string; trackingNumber: string } };
        create: Record<string, any>;
        update: Record<string, any>;
      }) => {
        const existing = findRentalByUnique(where);
        if (existing) {
          applyUpdate(existing, update);
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
      create: async ({ data }: { data: any }) => {
        shops.push({ ...data });
        return data;
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: any;
        update: any;
      }) => {
        let rec = shops.find((s) => s.id === where.id);
        if (rec) {
          applyUpdate(rec, update);
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
      findMany: async ({ where }: { where?: Record<string, any> }) =>
        pages.filter((p) => matchesWhere(p, where)),
      createMany: async ({ data }: { data: any[] }) => {
        data.forEach((d) => pages.push({ ...d }));
        return { count: data.length };
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { id: string };
        create: any;
        update: any;
      }) => {
        let rec = pages.find((p) => p.id === where.id);
        if (rec) {
          applyUpdate(rec, update);
          return rec;
        }
        rec = { ...create };
        pages.push(rec);
        return rec;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const rec = pages.find((p) => p.id === where.id);
        if (!rec) throw new Error("Page not found");
        applyUpdate(rec, data);
        return rec;
      },
      deleteMany: async ({ where }: { where?: Record<string, any> }) => ({
        count: deleteMatching(pages, where),
      }),
    },

    customerProfile: {
      findUnique: async ({ where }: { where: { customerId: string } }) =>
        customerProfiles.find((p) => p.customerId === where.customerId) ?? null,
      findFirst: async ({ where }: { where?: Record<string, any> }) =>
        customerProfiles.find((p) => matchesWhere(p, where)) ?? null,
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { customerId: string };
        create: any;
        update: any;
      }) => {
        let rec = customerProfiles.find((p) => p.customerId === where.customerId);
        if (rec) {
          applyUpdate(rec, update);
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
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { shop_customerId_month: { shop: string; customerId: string; month: string } };
        create: any;
        update: any;
      }) => {
        const w = where.shop_customerId_month;
        let rec = subscriptionUsages.find(
          (r) => r.shop === w.shop && r.customerId === w.customerId && r.month === w.month,
        );
        if (rec) {
          applyUpdate(rec, update);
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
      findFirst: async ({ where }: { where?: Record<string, any> }) =>
        users.find((u) => matchesWhere(u, where)) ?? null,
      create: async ({ data }: { data: any }) => {
        users.push({ ...data });
        return data;
      },
      update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
        const rec = users.find((u) =>
          where.id ? u.id === where.id : where.email ? u.email === where.email : false,
        );
        if (!rec) throw new Error("User not found");
        applyUpdate(rec, data);
        return rec;
      },
    },

    reverseLogisticsEvent: {
      create: async ({ data }: { data: any }) => {
        const rec = { id: String(reverseLogisticsEvents.length + 1), ...data };
        reverseLogisticsEvents.push(rec);
        return rec;
      },
      findMany: async ({
        where,
        orderBy,
      }: {
        where?: Record<string, any>;
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
  } as unknown as PrismaClient;
}

let prisma: PrismaClient;

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
      });
    }
  } catch {
    // If Prisma client cannot be loaded, fall back to the in-memory stub
    prisma = createStubPrisma();
  }
}

export { prisma };
