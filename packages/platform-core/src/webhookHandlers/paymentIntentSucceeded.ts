import type Stripe from "stripe";
import {
  persistRiskFromCharge,
  type ChargeWithInvoice,
} from "../internal/helpers/risk";

export default async function paymentIntentSucceeded(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;
  const latest = pi.latest_charge;
  const charge =
    latest && typeof latest !== "string"
      ? (latest as ChargeWithInvoice)
      : undefined;
  if (charge) {
    await persistRiskFromCharge(shop, charge);
  }
}
