import type Stripe from "stripe";

import { updateSubscriptionPaymentStatus } from "../repositories/subscriptions.server";

interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null;
}

export default async function invoicePaymentFailed(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const invoice = event.data.object as InvoiceWithSubscription;
  const customer = invoice.customer as string | Stripe.Customer | null;
  const subscription = invoice.subscription;
  const customerId = typeof customer === "string" ? customer : customer?.id;
  const subscriptionId =
    typeof subscription === "string" ? subscription : subscription?.id;
  if (customerId && subscriptionId) {
    await updateSubscriptionPaymentStatus(
      customerId,
      subscriptionId,
      "failed",
    );
  }
}
