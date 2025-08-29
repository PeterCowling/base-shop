import { coreEnv } from "@acme/config/env/core";
import type { PrismaClient } from "@prisma/client";
import "./prisma";

type RentalOrderStub = {
  shop?: string;
  customerId?: string;
  sessionId?: string;
  trackingNumber?: string;
  [key: string]: unknown;
};

type FindManyArgs = {
  where?: { shop?: string; customerId?: string };
};

type UpdateArgs = {
  where:
    | { shop_sessionId: { shop: string; sessionId: string } }
    | { shop_trackingNumber: { shop: string; trackingNumber: string } };
  data: Partial<RentalOrderStub>;
};

type CreateArgs = {
  data: RentalOrderStub;
};

function createStubPrisma(): PrismaClient {
  const rentalOrders: RentalOrderStub[] = [];

  return {
    rentalOrder: {
      findMany: async ({ where }: FindManyArgs) =>
        rentalOrders.filter((o) => {
          if (where?.shop && o.shop !== where.shop) return false;
          if (where?.customerId && o.customerId !== where.customerId)
            return false;
          return true;
        }),
      create: async ({ data }: CreateArgs) => {
        rentalOrders.push({ ...data });
        return data;
      },
      update: async ({ where, data }: UpdateArgs) => {
        let order: RentalOrderStub | undefined;
        if ("shop_sessionId" in where) {
          const { shop, sessionId } = where.shop_sessionId;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.sessionId === sessionId
          );
        } else {
          const { shop, trackingNumber } = where.shop_trackingNumber;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.trackingNumber === trackingNumber
          );
        }
        if (!order) throw new Error("Order not found");
        Object.assign(order, data);
        return order;
      },
    },
    shop: {
      findUnique: async () => ({ data: {} as Record<string, unknown> }),
    },
  } as unknown as PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "test" || !coreEnv.DATABASE_URL) {
  // In tests (or when no database URL is provided) fall back to an in-memory stub
  prisma = createStubPrisma();
} else {
  try {
    const { PrismaClient } =
      require("@prisma/client") as typeof import("@prisma/client");

    const databaseUrl = coreEnv.DATABASE_URL;
    prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
  } catch {
    // If Prisma client cannot be loaded, fall back to the in-memory stub
    prisma = createStubPrisma();
  }
}

export { prisma };
