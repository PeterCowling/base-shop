// packages/platform-core/src/subscriptionUsage.ts
import "server-only";

import type { SubscriptionUsage } from "@acme/types";

import { prisma } from "./db";

export async function getSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
): Promise<SubscriptionUsage> {
  return prisma.subscriptionUsage.findUniqueOrThrow({
    where: { shop_customerId_month: { shop, customerId, month } },
  });
}

export async function incrementSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
  count?: number,
): Promise<void> {
  const shipments = count ?? 1;

  await prisma.subscriptionUsage.upsert({
    where: { shop_customerId_month: { shop, customerId, month } },
    create: { shop, customerId, month, shipments },
    update: { shipments: { increment: shipments } },
  });
}
