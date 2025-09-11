// Use a loose PrismaClient type to avoid requiring the heavy @prisma/client
// dependency during tests. The actual client will be loaded dynamically when
// available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;
import { createRequire } from 'module';
import { loadCoreEnv } from '@acme/config/env/core';

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
  const products: { shopId: string; [key: string]: any }[] = [];

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

    product: {
      findMany: async ({ where: { shopId } }: any) =>
        products.filter((p) => p.shopId === shopId),
      deleteMany: async ({ where: { shopId } }: any) => {
        let count = 0;
        for (let i = products.length - 1; i >= 0; i--) {
          if (products[i].shopId === shopId) {
            products.splice(i, 1);
            count++;
          }
        }
        return { count };
      },
      createMany: async ({ data }: any) => {
        products.push(...data.map((d: any) => ({ ...d })));
        return { count: data.length };
      },
      findUnique: async ({ where }: any) => {
        if (where?.shopId_id) {
          const { shopId, id } = where.shopId_id;
          return (
            products.find((p) => p.shopId === shopId && p.id === id) || null
          );
        }
        return null;
      },
      update: async ({ where: { shopId_id }, data }: any) => {
        const idx = products.findIndex(
          (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
        );
        if (idx < 0) throw new Error('Product not found');
        products[idx] = { ...products[idx], ...data };
        return products[idx];
      },
      delete: async ({ where: { shopId_id } }: any) => {
        const idx = products.findIndex(
          (p) => p.shopId === shopId_id.shopId && p.id === shopId_id.id,
        );
        if (idx < 0) throw new Error('Product not found');
        const [removed] = products.splice(idx, 1);
        return removed;
      },
      create: async ({ data }: any) => {
        products.push({ ...data });
        return data;
      },
    } as unknown as PrismaClientType['product'],

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
let PrismaCtor: any;

function loadPrismaClient(): any {
  if (PrismaCtor !== undefined) return PrismaCtor;
  try {
    const moduleUrl = typeof __filename !== 'undefined'
      ? __filename
      : (Function('return import.meta.url')() as string);
    const req = createRequire(moduleUrl);
    PrismaCtor = (req("@prisma/client") as { PrismaClient: any }).PrismaClient;
  } catch {
    PrismaCtor = undefined;
  }
  return PrismaCtor;
}

const { DATABASE_URL } = loadCoreEnv();
const useStub = process.env.NODE_ENV === "test" || !DATABASE_URL;

const prisma: PrismaClientType = useStub
  ? (createTestPrismaStub() as unknown as PrismaClientType)
  : (() => {
      const PC = loadPrismaClient();
      if (!PC) {
        return createTestPrismaStub() as unknown as PrismaClientType;
      }
      return new PC({ datasources: { db: { url: DATABASE_URL } } }) as unknown as PrismaClientType;
    })();

export { prisma, createTestPrismaStub, loadPrismaClient };

