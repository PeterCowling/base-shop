/// <reference path="./prisma.d.ts" />
import { coreEnv } from "@acme/config/env/core";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "test" || !coreEnv.DATABASE_URL) {
  // In tests (or when no database URL is provided) fall back to an in-memory stub
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
  } as unknown as PrismaClient;
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
    const databaseUrl = coreEnv.DATABASE_URL;
    prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  } catch {
    // If Prisma client cannot be loaded, fall back to the in-memory stub
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
    } as unknown as PrismaClient;
  }
}

export { prisma };
