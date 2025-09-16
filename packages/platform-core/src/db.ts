// Use a loose PrismaClient type to avoid requiring the heavy @prisma/client
// dependency during tests. The actual client will be loaded dynamically when
// available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientType = any;
import { createRequire } from 'module';
import { loadCoreEnv } from '@acme/config/env/core';
import {
  createRentalOrderDelegate,
  createShopDelegate,
  createPageDelegate,
  createCustomerProfileDelegate,
  createCustomerMfaDelegate,
  createSubscriptionUsageDelegate,
  createUserDelegate,
  createReverseLogisticsEventDelegate,
  createProductDelegate,
  createInventoryItemDelegate,
  type InventoryItemDelegate,
} from './db/stubs';

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
  const stub = {
    rentalOrder: createRentalOrderDelegate() as unknown as PrismaClientType['rentalOrder'],
    shop: createShopDelegate() as unknown as PrismaClientType['shop'],
    page: createPageDelegate() as unknown as PrismaClientType['page'],
    customerProfile: createCustomerProfileDelegate() as unknown as PrismaClientType['customerProfile'],
    customerMfa: createCustomerMfaDelegate() as unknown as PrismaClientType['customerMfa'],
    subscriptionUsage: createSubscriptionUsageDelegate() as unknown as PrismaClientType['subscriptionUsage'],
    user: createUserDelegate() as unknown as PrismaClientType['user'],
    reverseLogisticsEvent: createReverseLogisticsEventDelegate() as unknown as PrismaClientType['reverseLogisticsEvent'],
    product: createProductDelegate() as unknown as PrismaClientType['product'],
    inventoryItem: createInventoryItemDelegate(),
  } as unknown as Pick<
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
  > & { inventoryItem: InventoryItemDelegate };

  stub.$transaction = async <T>(fn: (tx: typeof stub) => T): Promise<T> =>
    fn(stub);

  return stub;
}
let PrismaCtor: (new (...args: unknown[]) => PrismaClientType) | undefined;

function loadPrismaClient():
  | (new (...args: unknown[]) => PrismaClientType)
  | undefined {
  if (PrismaCtor !== undefined) return PrismaCtor;
  try {
    const moduleIdentifier = typeof __filename !== 'undefined'
      ? __filename
      : new URL(
          './db.ts',
          Function('return import.meta.url')() as string,
        );
    const req = createRequire(moduleIdentifier);
    PrismaCtor = (
      req("@prisma/client") as {
        PrismaClient: new (...args: unknown[]) => PrismaClientType;
      }
    ).PrismaClient;
  } catch {
    PrismaCtor = undefined;
  }
  return PrismaCtor;
}

let DATABASE_URL: string | undefined;
try {
  ({ DATABASE_URL } = loadCoreEnv());
} catch {
  DATABASE_URL = undefined;
}
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
