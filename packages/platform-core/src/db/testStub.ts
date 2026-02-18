// Test-only Prisma client stub.
//
// This file intentionally imports the per-model delegates (which are large) so
// production builds should never include it.

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
} from "../db/stubs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PrismaClient type varies by generated schema; safe to use any here
type PrismaClientType = any;

export function createTestPrismaStub(): Pick<
  PrismaClientType,
  | "rentalOrder"
  | "shop"
  | "page"
  | "product"
  | "customerProfile"
  | "customerIdentity"
  | "customerStripeMapping"
  | "stripeWebhookEvent"
  | "subscriptionUsage"
  | "user"
  | "reverseLogisticsEvent"
  | "customerMfa"
  | "sectionTemplate"
  | "inventoryHold"
  | "inventoryHoldItem"
  | "$transaction"
> & { inventoryItem: InventoryItemDelegate } {
  const stub = {
    rentalOrder:
      createRentalOrderDelegate() as unknown as PrismaClientType["rentalOrder"],
    shop: createShopDelegate() as unknown as PrismaClientType["shop"],
    page: createPageDelegate() as unknown as PrismaClientType["page"],
    customerProfile:
      createCustomerProfileDelegate() as unknown as PrismaClientType["customerProfile"],
    customerIdentity:
      createCustomerIdentityDelegate() as unknown as PrismaClientType["customerIdentity"],
    customerStripeMapping:
      createCustomerStripeMappingDelegate() as unknown as PrismaClientType["customerStripeMapping"],
    stripeWebhookEvent:
      createStripeWebhookEventDelegate() as unknown as PrismaClientType["stripeWebhookEvent"],
    customerMfa:
      createCustomerMfaDelegate() as unknown as PrismaClientType["customerMfa"],
    subscriptionUsage:
      createSubscriptionUsageDelegate() as unknown as PrismaClientType["subscriptionUsage"],
    user: createUserDelegate() as unknown as PrismaClientType["user"],
    reverseLogisticsEvent:
      createReverseLogisticsEventDelegate() as unknown as PrismaClientType["reverseLogisticsEvent"],
    product: createProductDelegate() as unknown as PrismaClientType["product"],
    inventoryHold:
      createInventoryHoldDelegate() as unknown as PrismaClientType["inventoryHold"],
    inventoryHoldItem:
      createInventoryHoldItemDelegate() as unknown as PrismaClientType["inventoryHoldItem"],
    inventoryItem: createInventoryItemDelegate(),
    sectionTemplate:
      createSectionTemplateDelegate() as unknown as PrismaClientType["sectionTemplate"],
  } as unknown as Pick<
    PrismaClientType,
    | "rentalOrder"
    | "shop"
    | "page"
    | "product"
    | "customerProfile"
    | "customerIdentity"
    | "customerStripeMapping"
    | "stripeWebhookEvent"
    | "subscriptionUsage"
    | "user"
    | "reverseLogisticsEvent"
    | "customerMfa"
    | "sectionTemplate"
    | "inventoryHold"
    | "inventoryHoldItem"
    | "$transaction"
  > & { inventoryItem: InventoryItemDelegate };

  stub.$transaction = async <T>(fn: (tx: typeof stub) => T): Promise<T> =>
    fn(stub);

  return stub;
}
