import { PrismaClient } from '@prisma/client';

/**
 * Avoid augmenting `PrismaClient` with a permissive index signature.
 * For dynamic model access, use a typed helper instead:
 *
 * ```ts
 * function getModelDelegate<K extends keyof PrismaClient>(
 *   client: PrismaClient,
 *   model: K,
 * ): PrismaClient[K] {
 *   return client[model];
 * }
 * ```
 */

type RentalOrder = {
  shop: string;
  sessionId: string;
  trackingNumber?: string | null;
  customerId?: string | null;
  [key: string]: any;
};

function createTestPrismaStub(): Pick<
  PrismaClient,
  | 'rentalOrder'
  | 'shop'
  | 'page'
  | 'customerProfile'
  | 'subscriptionUsage'
  | 'user'
  | 'reverseLogisticsEvent'
> {
  const rentalOrders: RentalOrder[] = [];
  const customerProfiles: { customerId: string; name: string; email: string }[] = [];

  return {
    rentalOrder: {
      findMany: async ({ where }: any) =>
        rentalOrders.filter((o) => {
          if (!where) return true;
          if (where.shop && o.shop !== where.shop) return false;
          if (where.customerId && o.customerId !== where.customerId) return false;
          return true;
        }),
      findUnique: async ({ where }: any) => {
        if (where?.shop_sessionId) {
          const { shop, sessionId } = where.shop_sessionId;
          return (
            rentalOrders.find(
              (o) => o.shop === shop && o.sessionId === sessionId,
            ) || null
          );
        }
        return null;
      },
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
    } as PrismaClient['rentalOrder'],

    shop: {
      findUnique: async () => ({ data: {} }),
    } as PrismaClient['shop'],

    page: {
      createMany: async () => {},
      findMany: async () => [],
      update: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      upsert: async () => ({}),
    } as PrismaClient['page'],

    customerProfile: {
      findUnique: async ({ where }: any) =>
        customerProfiles.find((p) => p.customerId === where.customerId) || null,
      findFirst: async ({ where }: any) => {
        const email = where?.email;
        const notCustomerId = where?.NOT?.customerId;
        return (
          customerProfiles.find(
            (p) => p.email === email && (!notCustomerId || p.customerId !== notCustomerId),
          ) || null
        );
      },
      upsert: async ({ where, update, create }: any) => {
        const idx = customerProfiles.findIndex((p) => p.customerId === where.customerId);
        if (idx >= 0) {
          customerProfiles[idx] = { ...customerProfiles[idx], ...update };
          return customerProfiles[idx];
        }
        const profile = { ...create };
        customerProfiles.push(profile);
        return profile;
      },
    } as PrismaClient['customerProfile'],

    subscriptionUsage: {
      findUnique: async () => null,
      upsert: async () => ({}),
    } as PrismaClient['subscriptionUsage'],

    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
      update: async () => ({}),
    } as PrismaClient['user'],

    reverseLogisticsEvent: {
      create: async () => ({}),
      findMany: async () => [],
    } as PrismaClient['reverseLogisticsEvent'],
  };
}
const prisma =
  process.env.DATABASE_URL ? new PrismaClient() : createTestPrismaStub();

export { prisma };

