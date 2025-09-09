import type { PrismaClient as PrismaClientType } from '@prisma/client';

let PrismaClient: { new (): PrismaClientType } | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const req = Function('return require')();
  ({ PrismaClient } = req('@prisma/client'));
} catch {
  // `@prisma/client` isn't installed – tests will use the stub.
}

/**
 * Avoid augmenting `PrismaClient` with a permissive index signature.
 * For dynamic model access, use a typed helper instead.
 * See `docs/contributing.md#prisma-model-access` for details:
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

type InventoryItemDelegate = {
  findMany(args: any): Promise<any[]>;
  deleteMany(args: any): Promise<{ count: number }>;
  createMany(args: any): Promise<{ count: number }>;
  findUnique(args: any): Promise<any | null>;
  delete(args: any): Promise<any>;
  upsert(args: any): Promise<any>;
};

function createTestPrismaStub(): Pick<
  PrismaClientType,
  | 'rentalOrder'
  | 'shop'
  | 'page'
  | 'customerProfile'
  | 'subscriptionUsage'
  | 'user'
  | 'reverseLogisticsEvent'
  | 'customerMfa'
  | '$transaction'
> & { inventoryItem: InventoryItemDelegate } {
  const rentalOrders: RentalOrder[] = [];
  const customerProfiles: { customerId: string; name: string; email: string }[] = [];
  const customerMfas: {
    customerId: string;
    secret: string;
    enabled: boolean;
  }[] = [];
  const inventoryItems: { shopId: string; [key: string]: any }[] = [];

  const stub = {
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
    } as unknown as PrismaClientType['rentalOrder'],

    shop: {
      findUnique: async () => ({ data: {} }),
    } as unknown as PrismaClientType['shop'],

    page: {
      createMany: async () => {},
      findMany: async () => [],
      update: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      upsert: async () => ({}),
    } as unknown as PrismaClientType['page'],

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
    } as unknown as PrismaClientType['customerProfile'],

    customerMfa: {
      upsert: async ({ where, update, create }: any) => {
        const idx = customerMfas.findIndex(
          (m) => m.customerId === where.customerId,
        );
        if (idx >= 0) {
          customerMfas[idx] = { ...customerMfas[idx], ...update };
          return customerMfas[idx];
        }
        const record = { ...create };
        customerMfas.push(record);
        return record;
      },
      findUnique: async ({ where }: any) =>
        customerMfas.find((m) => m.customerId === where.customerId) || null,
      update: async ({ where, data }: any) => {
        const idx = customerMfas.findIndex(
          (m) => m.customerId === where.customerId,
        );
        if (idx < 0) throw new Error('CustomerMfa not found');
        customerMfas[idx] = { ...customerMfas[idx], ...data };
        return customerMfas[idx];
      },
    } as unknown as PrismaClientType['customerMfa'],

    subscriptionUsage: {
      findUnique: async () => null,
      upsert: async () => ({}),
    } as unknown as PrismaClientType['subscriptionUsage'],

    user: {
      findUnique: async () => null,
      findFirst: async () => null,
      create: async () => ({}),
      update: async () => ({}),
    } as unknown as PrismaClientType['user'],

    reverseLogisticsEvent: {
      create: async () => ({}),
      findMany: async () => [],
    } as unknown as PrismaClientType['reverseLogisticsEvent'],

    inventoryItem: {
      findMany: async ({ where: { shopId } }: any) =>
        inventoryItems.filter((i) => i.shopId === shopId),
      deleteMany: async ({ where: { shopId } }: any) => {
        let count = 0;
        for (let i = inventoryItems.length - 1; i >= 0; i--) {
          if (inventoryItems[i].shopId === shopId) {
            inventoryItems.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
      createMany: async ({ data }: any) => {
        inventoryItems.push(
          ...data.map((item: any) => ({ ...item })),
        );
        return { count: data.length };
      },
      findUnique: async ({ where: { shopId_sku_variantKey } }: any) => {
        const { shopId, sku, variantKey } = shopId_sku_variantKey;
        return (
          inventoryItems.find(
            (i) =>
              i.shopId === shopId &&
              i.sku === sku &&
              i.variantKey === variantKey,
          ) || null
        );
      },
      delete: async ({ where: { shopId_sku_variantKey } }: any) => {
        const { shopId, sku, variantKey } = shopId_sku_variantKey;
        const idx = inventoryItems.findIndex(
          (i) =>
            i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
        );
        if (idx < 0) throw new Error('InventoryItem not found');
        const [removed] = inventoryItems.splice(idx, 1);
        return removed;
      },
      upsert: async ({ where: { shopId_sku_variantKey }, update, create }: any) => {
        const { shopId, sku, variantKey } = shopId_sku_variantKey;
        const idx = inventoryItems.findIndex(
          (i) =>
            i.shopId === shopId && i.sku === sku && i.variantKey === variantKey,
        );
        if (idx >= 0) {
          inventoryItems[idx] = { ...inventoryItems[idx], ...update };
          return inventoryItems[idx];
        }
        const record = { ...create };
        inventoryItems.push(record);
        return record;
      },
    } as InventoryItemDelegate,
  } as any;

  stub.$transaction = async (fn: (tx: typeof stub) => any) => fn(stub);

  return stub;
}
const prisma =
  process.env.DATABASE_URL && PrismaClient
    ? new PrismaClient()
    : createTestPrismaStub();

export { prisma, createTestPrismaStub };

