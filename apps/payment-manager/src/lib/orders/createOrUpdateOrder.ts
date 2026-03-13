/**
 * createOrUpdateOrder — write (or upsert) an Order row in the Payment Manager database.
 *
 * Called from Caryina's checkout path via a fire-and-forget dual-write:
 *   void createOrUpdateOrder(data).catch(err => log("warn", "pm_dual_write_failed", err))
 *
 * The write is non-blocking and must never throw into the caller's critical path.
 * Idempotent: uses upsert on Order.id (safe for checkout retries).
 */

import { prisma } from "@acme/platform-core/db";

export interface CreateOrUpdateOrderInput {
  id: string;
  shopId: string;
  provider: string;
  status?: string;
  amountCents: number;
  currency?: string;
  customerEmail?: string;
  providerOrderId?: string;
  lineItemsJson?: unknown;
}

export async function createOrUpdateOrder(input: CreateOrUpdateOrderInput): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 prisma client type varies by generated schema; safe to use any here
  const prismaAny = prisma as any;
  await prismaAny.order.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      shopId: input.shopId,
      provider: input.provider,
      status: input.status ?? "pending",
      amountCents: input.amountCents,
      currency: input.currency ?? "EUR",
      customerEmail: input.customerEmail ?? null,
      providerOrderId: input.providerOrderId ?? null,
      lineItemsJson: input.lineItemsJson ?? null,
    },
    update: {
      shopId: input.shopId,
      provider: input.provider,
      status: input.status ?? "pending",
      amountCents: input.amountCents,
      currency: input.currency ?? "EUR",
      customerEmail: input.customerEmail ?? null,
      providerOrderId: input.providerOrderId ?? null,
      lineItemsJson: input.lineItemsJson ?? null,
    },
  });
}
