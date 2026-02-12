// Use a loose PrismaClient type to avoid requiring the heavy @prisma/client
// dependency during tests. The actual client will be loaded dynamically when
// available.
 
import { createRequire } from 'module';

import { loadCoreEnv } from '@acme/config/env/core';

import {
  createCustomerIdentityDelegate,
  createCustomerMfaDelegate,
  createCustomerProfileDelegate,
  createCustomerStripeMappingDelegate,
  createInventoryHoldDelegate,
  createInventoryHoldItemDelegate,
  createInventoryItemDelegate,
  createPageDelegate,
  createProductDelegate,
  createRentalOrderDelegate,
  createReverseLogisticsEventDelegate,
  createSectionTemplateDelegate,
  createShopDelegate,
  createStripeWebhookEventDelegate,
  createSubscriptionUsageDelegate,
  createUserDelegate,
  type InventoryItemDelegate,
} from './db/stubs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaClient type varies by generated schema; safe to use any here
type PrismaClientType = any;

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
  | 'customerIdentity'
  | 'customerStripeMapping'
  | "stripeWebhookEvent"
  | 'subscriptionUsage'
  | 'user'
  | 'reverseLogisticsEvent'
  | 'customerMfa'
  | 'sectionTemplate'
  | 'inventoryHold'
  | 'inventoryHoldItem'
  | '$transaction'
  > & { inventoryItem: InventoryItemDelegate } {
  const stub = {
    rentalOrder: createRentalOrderDelegate() as unknown as PrismaClientType['rentalOrder'],
    shop: createShopDelegate() as unknown as PrismaClientType['shop'],
    page: createPageDelegate() as unknown as PrismaClientType['page'],
    customerProfile: createCustomerProfileDelegate() as unknown as PrismaClientType['customerProfile'],
    customerIdentity: createCustomerIdentityDelegate() as unknown as PrismaClientType['customerIdentity'],
    customerStripeMapping: createCustomerStripeMappingDelegate() as unknown as PrismaClientType['customerStripeMapping'],
    stripeWebhookEvent: createStripeWebhookEventDelegate() as unknown as PrismaClientType["stripeWebhookEvent"],
    customerMfa: createCustomerMfaDelegate() as unknown as PrismaClientType['customerMfa'],
    subscriptionUsage: createSubscriptionUsageDelegate() as unknown as PrismaClientType['subscriptionUsage'],
    user: createUserDelegate() as unknown as PrismaClientType['user'],
    reverseLogisticsEvent: createReverseLogisticsEventDelegate() as unknown as PrismaClientType['reverseLogisticsEvent'],
    product: createProductDelegate() as unknown as PrismaClientType['product'],
    inventoryHold: createInventoryHoldDelegate() as unknown as PrismaClientType['inventoryHold'],
    inventoryHoldItem: createInventoryHoldItemDelegate() as unknown as PrismaClientType['inventoryHoldItem'],
    inventoryItem: createInventoryItemDelegate(),
    sectionTemplate: createSectionTemplateDelegate() as unknown as PrismaClientType['sectionTemplate'],
  } as unknown as Pick<
    PrismaClientType,
    | 'rentalOrder'
    | 'shop'
    | 'page'
    | 'customerProfile'
    | 'customerIdentity'
    | 'customerStripeMapping'
    | "stripeWebhookEvent"
    | 'subscriptionUsage'
    | 'user'
    | 'reverseLogisticsEvent'
    | 'customerMfa'
    | 'sectionTemplate'
    | 'inventoryHold'
    | 'inventoryHoldItem'
    | '$transaction'
  > & { inventoryItem: InventoryItemDelegate };

  stub.$transaction = async <T>(fn: (tx: typeof stub) => T): Promise<T> =>
    fn(stub);

  return stub;
}
type RequireFn = ReturnType<typeof createRequire>;

function resolveRequire(): RequireFn | undefined {
  const globalRequire = (globalThis as { require?: unknown }).require;
  if (typeof globalRequire === "function") {
    return globalRequire as RequireFn;
  }
  if (typeof __filename === "string") {
    try {
      return createRequire(__filename);
    } catch {
      // ignore and fall back to cwd based resolution
    }
  }
  try {
    return createRequire(process.cwd() + "/");
  } catch {
    return undefined;
  }
}

let PrismaCtor: (new (...args: unknown[]) => PrismaClientType) | undefined;

function loadPrismaClient():
  | (new (...args: unknown[]) => PrismaClientType)
  | undefined {
  if (PrismaCtor !== undefined) return PrismaCtor;
  try {
    const req = resolveRequire();
    if (!req) {
      PrismaCtor = undefined;
      return PrismaCtor;
    }
    const modAny = req("@prisma/client"); // i18n-exempt -- DS-0001 Module identifier string, not user-facing copy
    const reqMod = modAny as {
      PrismaClient: new (...args: unknown[]) => PrismaClientType;
    };
    PrismaCtor = reqMod.PrismaClient;
  } catch {
    PrismaCtor = undefined;
  }
  return PrismaCtor;
}

let DATABASE_URL: string | undefined;
try {
  ({ DATABASE_URL } = loadCoreEnv());
} catch {
  // Fall back to raw process.env when core env validation fails in tests
  DATABASE_URL = process.env.DATABASE_URL;
}
// Ensure direct env var takes precedence when core env omits DATABASE_URL
if (!DATABASE_URL && typeof process.env.DATABASE_URL === "string") {
  DATABASE_URL = process.env.DATABASE_URL;
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

export { createTestPrismaStub, loadPrismaClient,prisma };
