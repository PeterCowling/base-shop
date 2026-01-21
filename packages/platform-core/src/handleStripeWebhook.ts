import type Stripe from "stripe";

import {
  markStripeWebhookEventFailed,
  markStripeWebhookEventProcessed,
  wasStripeWebhookEventProcessed,
} from "./stripeWebhookEventStore";
import chargeRefunded from "./webhookHandlers/chargeRefunded";
import chargeSucceeded from "./webhookHandlers/chargeSucceeded";
import checkoutSessionCompleted from "./webhookHandlers/checkoutSessionCompleted";
import customerSubscriptionDeleted from "./webhookHandlers/customerSubscriptionDeleted";
import customerSubscriptionUpdated from "./webhookHandlers/customerSubscriptionUpdated";
import invoicePaymentFailed from "./webhookHandlers/invoicePaymentFailed";
import invoicePaymentSucceeded from "./webhookHandlers/invoicePaymentSucceeded";
import paymentIntentPaymentFailed from "./webhookHandlers/paymentIntentPaymentFailed";
import paymentIntentSucceeded from "./webhookHandlers/paymentIntentSucceeded";
import radarEarlyFraudWarning from "./webhookHandlers/radarEarlyFraudWarning";
import reviewClosed from "./webhookHandlers/reviewClosed";
import reviewOpened from "./webhookHandlers/reviewOpened";

const noop = async () => {};

const handlers: Record<string, (shop: string, event: Stripe.Event) => Promise<void>> = {
  "checkout.session.completed": checkoutSessionCompleted,
  "charge.refunded": chargeRefunded,
  "payment_intent.payment_failed": paymentIntentPaymentFailed,
  "payment_intent.succeeded": paymentIntentSucceeded,
  "invoice.payment_succeeded": invoicePaymentSucceeded,
  "invoice.payment_failed": invoicePaymentFailed,
  "customer.subscription.updated": customerSubscriptionUpdated,
  "customer.subscription.deleted": customerSubscriptionDeleted,
  "charge.succeeded": chargeSucceeded,
  "review.opened": reviewOpened,
  "review.closed": reviewClosed,
};

export async function handleStripeWebhook(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const eventId = typeof event.id === "string" && event.id.length ? event.id : undefined;
  if (eventId && (await wasStripeWebhookEventProcessed(eventId))) return;
  const handler =
    handlers[event.type] ||
    (event.type.startsWith("radar.early_fraud_warning.")
      ? radarEarlyFraudWarning
      : noop);
  try {
    await handler(shop, event);
    if (eventId) await markStripeWebhookEventProcessed(shop, event);
  } catch (err) {
    if (eventId) await markStripeWebhookEventFailed(shop, event, err);
    throw err;
  }
}
