import type Stripe from "stripe";
import { markNeedsAttention } from "../orders/risk";
import { extractSessionIdFromCharge, type ChargeWithInvoice } from "../helpers/risk";

export default async function paymentIntentPaymentFailed(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const latest = pi.latest_charge;
  const charge =
    latest && typeof latest !== "string"
      ? (latest as ChargeWithInvoice)
      : undefined;
  const sessionId = charge
    ? extractSessionIdFromCharge(charge) || charge.id
    : pi.id;
  await markNeedsAttention(shop, sessionId);
}
