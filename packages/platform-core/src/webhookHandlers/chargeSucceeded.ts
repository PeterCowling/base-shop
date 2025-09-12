import type Stripe from "stripe";
import { persistRiskFromCharge, type ChargeWithInvoice } from "../helpers/risk";

export default async function chargeSucceeded(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const charge = event.data.object as ChargeWithInvoice;
  await persistRiskFromCharge(shop, charge);
}
