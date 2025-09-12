import type Stripe from "stripe";
import checkoutSessionCompleted from "./webhookHandlers/checkoutSessionCompleted";
import chargeRefunded from "./webhookHandlers/chargeRefunded";
import paymentIntentPaymentFailed from "./webhookHandlers/paymentIntentPaymentFailed";
import paymentIntentSucceeded from "./webhookHandlers/paymentIntentSucceeded";
import invoicePayment from "./webhookHandlers/invoicePayment";
import customerSubscriptionUpdated from "./webhookHandlers/customerSubscriptionUpdated";
import customerSubscriptionDeleted from "./webhookHandlers/customerSubscriptionDeleted";
import chargeSucceeded from "./webhookHandlers/chargeSucceeded";
import reviewOpened from "./webhookHandlers/reviewOpened";
import reviewClosed from "./webhookHandlers/reviewClosed";
import radarEarlyFraudWarning from "./webhookHandlers/radarEarlyFraudWarning";

export async function handleStripeWebhook(
  shop: string,
  event: Stripe.Event
): Promise<void> {
  const handlers: Record<string, (shop: string, event: Stripe.Event) => Promise<void>> = {
    "checkout.session.completed": checkoutSessionCompleted,
    "charge.refunded": chargeRefunded,
    "payment_intent.payment_failed": paymentIntentPaymentFailed,
    "payment_intent.succeeded": paymentIntentSucceeded,
    "invoice.payment_succeeded": invoicePayment,
    "invoice.payment_failed": invoicePayment,
    "customer.subscription.updated": customerSubscriptionUpdated,
    "customer.subscription.deleted": customerSubscriptionDeleted,
    "charge.succeeded": chargeSucceeded,
    "review.opened": reviewOpened,
    "review.closed": reviewClosed,
  };
  const handler =
    handlers[event.type] ||
    (event.type.startsWith("radar.early_fraud_warning.")
      ? radarEarlyFraudWarning
      : async () => {});
  await handler(shop, event);
}
