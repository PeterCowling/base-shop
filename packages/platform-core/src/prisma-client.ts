import type { PrismaClient as GeneratedPrismaClient } from "@prisma/client";

/**
 * Re-export Prisma's generated type. Importing with `import type`
 * allows TypeScript to infer the model delegates (shop, page,
 * rentalOrder, etc.) without bundling any runtime from '@prisma/client'.
 */
export type PrismaClient = GeneratedPrismaClient;

/**
 * Dynamically access a Prisma model delegate with full type safety.
 */
export function getModelDelegate<K extends keyof PrismaClient>(
  client: PrismaClient,
  model: K
): PrismaClient[K] {
  return client[model];
}
