// packages/platform-core/src/subscriptionUsage.ts
import "server-only";
import { prisma } from "./db";
import type { SubscriptionUsage } from "@acme/types";

export async function getSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
): Promise<SubscriptionUsage | null> {
  return prisma.subscriptionUsage.findUnique({
    where: { shop_customerId_month: { shop, customerId, month } },
  });
}

export async function incrementSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
  count = 1,
): Promise<void> {
  await prisma.subscriptionUsage.upsert({
    where: { shop_customerId_month: { shop, customerId, month } },
    create: { shop, customerId, month, shipments: count },
    update: { shipments: { increment: count } },
  });
}
