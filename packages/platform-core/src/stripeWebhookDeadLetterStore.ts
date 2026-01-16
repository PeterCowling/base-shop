import type Stripe from "stripe";
import { prisma } from "./db";
import { resolveStripeEnvironmentLabel } from "./stripeObjectShopMapStore";

export type StripeWebhookDeadLetterReason = "unresolved_tenant";

export async function recordStripeWebhookDeadLetter(params: {
  environment?: string;
  event: Stripe.Event;
  reason: StripeWebhookDeadLetterReason;
  shopId?: string | null;
}): Promise<void> {
  const environment = resolveStripeEnvironmentLabel(params.environment);
  const eventId = typeof params.event.id === "string" ? params.event.id : "";
  if (!eventId) return;

  await prisma.stripeWebhookDeadLetter.upsert({
    where: {
      environment_eventId: {
        environment,
        eventId,
      },
    },
    create: {
      environment,
      eventId,
      eventType: params.event.type,
      reason: params.reason,
      shopId: params.shopId ?? null,
      payload: params.event as unknown,
    },
    update: {
      eventType: params.event.type,
      reason: params.reason,
      shopId: params.shopId ?? null,
      payload: params.event as unknown,
    },
  });
}

