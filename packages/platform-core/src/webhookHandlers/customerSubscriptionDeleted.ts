import type Stripe from "stripe";
import { syncSubscriptionData } from "../repositories/subscriptions.server";

export default async function customerSubscriptionDeleted(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const customer = subscription.customer as string | Stripe.Customer;
  const customerId = typeof customer === "string" ? customer : customer.id;
  await syncSubscriptionData(customerId, null);
}
