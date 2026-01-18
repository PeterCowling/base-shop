type PrismaClientType = any;
import { type InventoryItemDelegate } from './db/stubs';
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
declare function createTestPrismaStub(): Pick<PrismaClientType, 'rentalOrder' | 'shop' | 'page' | 'customerProfile' | 'customerIdentity' | 'customerStripeMapping' | "stripeWebhookEvent" | 'subscriptionUsage' | 'user' | 'reverseLogisticsEvent' | 'customerMfa' | 'sectionTemplate' | '$transaction'> & {
    inventoryItem: InventoryItemDelegate;
};
declare function loadPrismaClient(): (new (...args: unknown[]) => PrismaClientType) | undefined;
declare const prisma: PrismaClientType;
export { prisma, createTestPrismaStub, loadPrismaClient };
