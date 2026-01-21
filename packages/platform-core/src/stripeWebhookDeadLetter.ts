import "server-only";

import type Stripe from "stripe";

import { prisma } from "./db";

export type StripeWebhookDeadLetterReason =
  | "unresolved_tenant"
  | "handler_error"
  | (string & {});

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function deadLetterStripeWebhookEvent(params: {
  event: Stripe.Event;
  reason: StripeWebhookDeadLetterReason;
  shopId?: string | null;
}): Promise<void> {
  const stripeEventId = isNonEmptyString(params.event.id) ? params.event.id : null;
  if (!stripeEventId) {
    throw new Error("Stripe event id is missing"); // i18n-exempt -- internal validation error, not UI copy
  }

  const livemode = params.event.livemode === true;
  await prisma.stripeWebhookDeadLetter.upsert({
    where: { livemode_stripeEventId: { livemode, stripeEventId } },
    create: {
      livemode,
      stripeEventId,
      type: params.event.type,
      shopId: params.shopId ?? null,
      reason: params.reason,
      payload: params.event,
    },
    update: {
      type: params.event.type,
      shopId: params.shopId ?? null,
      reason: params.reason,
      payload: params.event,
    },
  });
}
