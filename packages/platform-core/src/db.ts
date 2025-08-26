import { coreEnv } from "@acme/config/env/core";

let prisma: unknown;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
  const databaseUrl =
    coreEnv.DATABASE_URL ?? "file:./packages/platform-core/dev.db";
  prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
} catch {
  // Fallback in-memory stub for environments without Prisma client (e.g., tests)
  const rentalOrders: any[] = [];
  prisma = {
    rentalOrder: {
      findMany: async ({ where }: any) =>
        rentalOrders.filter((o) => {
          if (where?.shop && o.shop !== where.shop) return false;
          if (where?.customerId && o.customerId !== where.customerId) return false;
          return true;
        }),
      create: async ({ data }: any) => {
        rentalOrders.push({ ...data });
        return data;
      },
      update: async ({ where, data }: any) => {
        let order;
        if (where?.shop_sessionId) {
          const { shop, sessionId } = where.shop_sessionId;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.sessionId === sessionId,
          );
        } else if (where?.shop_trackingNumber) {
          const { shop, trackingNumber } = where.shop_trackingNumber;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.trackingNumber === trackingNumber,
          );
        }
        if (!order) throw new Error("Order not found");
        Object.assign(order, data);
        return order;
      },
    },
    shop: {
      findUnique: async () => ({ data: {} }),
    },
  } as unknown;
}

export { prisma };
