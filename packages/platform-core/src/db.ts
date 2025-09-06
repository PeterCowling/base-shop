import type { PrismaClient as RealPrismaClient } from '@prisma/client';
import type { PrismaClient } from './prisma-client';

type RentalOrder = {
  shop: string;
  sessionId: string;
  trackingNumber?: string | null;
  customerId?: string | null;
  [key: string]: any;
};

function createTestPrismaStub(): PrismaClient {
  const rentalOrders: RentalOrder[] = [];

  return {
    rentalOrder: {
      findMany: async ({ where }: any) =>
        rentalOrders.filter((o) => {
          if (!where) return true;
          if (where.shop && o.shop !== where.shop) return false;
          if (where.customerId && o.customerId !== where.customerId) return false;
          return true;
        }),
      create: async ({ data }: { data: RentalOrder }) => {
        rentalOrders.push({ ...data });
        return data;
      },
      update: async ({ where, data }: any) => {
        let order: RentalOrder | undefined;
        if ('shop_sessionId' in where) {
          const { shop, sessionId } = where.shop_sessionId;
          order = rentalOrders.find((o) => o.shop === shop && o.sessionId === sessionId);
        } else if ('shop_trackingNumber' in where) {
          const { shop, trackingNumber } = where.shop_trackingNumber;
          order = rentalOrders.find(
            (o) => o.shop === shop && o.trackingNumber === trackingNumber,
          );
        }
        if (!order) throw new Error('Order not found');
        Object.assign(order, data);
        return order;
      },
    },

    shop: {
      findUnique: async () => ({ data: {} }),
    },

    page: {
      createMany: async () => {},
      findMany: async () => [],
      update: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      upsert: async () => ({}),
    },

    customerProfile: {
      findUnique: async () => null,
      findFirst: async () => null,
      upsert: async () => ({}),
    },

    subscriptionUsage: {
      findUnique: async () => null,
      upsert: async () => ({}),
    },

    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
      update: async () => ({}),
    },

    reverseLogisticsEvent: {
      create: async () => ({}),
      findMany: async () => [],
    },
  } as unknown as PrismaClient;
}

let prisma: PrismaClient;

if (process.env.DATABASE_URL) {
  // Import at runtime to avoid bundling in tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient: RealClient } = require('@prisma/client') as {
    PrismaClient: new (...args: any[]) => RealPrismaClient;
  };
  prisma = new RealClient() as unknown as PrismaClient;
} else {
  prisma = createTestPrismaStub();
}

export { prisma };

