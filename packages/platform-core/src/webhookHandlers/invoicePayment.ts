import type Stripe from "stripe";
import type { InvoiceWithSubscription } from "./utils";
import { updateSubscriptionPaymentStatus } from "../repositories/subscriptions.server";

export default async function invoicePayment(
  _shop: string,
  event: Stripe.Event
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
      event.type === "invoice.payment_succeeded" ? "succeeded" : "failed"
    );
  }
}
