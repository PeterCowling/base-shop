// packages/platform-core/src/repositories/subscriptionUsage.server.ts
import "server-only";

import { prisma } from "../db";

/**
 * Retrieves the number of shipments used by a customer for the
 * current billing period (calendar month).
 */
export async function getUsage(
  shop: string,
  customerId: string,
  period: string,
): Promise<number> {
  const record = await prisma.subscriptionUsage.findUnique({
    where: { shop_customerId_period: { shop, customerId, period } },
  });
  return record?.shipments ?? 0;
}

/**
 * Increments the shipment usage counter for the given customer
 * in the current billing period.
 */
export async function incrementUsage(
  shop: string,
  customerId: string,
  period: string,
): Promise<void> {
  await prisma.subscriptionUsage.upsert({
    where: { shop_customerId_period: { shop, customerId, period } },
    update: { shipments: { increment: 1 } },
    create: { shop, customerId, period, shipments: 1 },
  });
}

/** Utility to generate a YYYY-MM period string for the current month */
export function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
