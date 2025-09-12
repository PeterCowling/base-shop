import type Stripe from "stripe";
import { persistRiskFromCharge } from "./utils";
import type { ChargeWithInvoice } from "./utils";

export default async function chargeSucceeded(
  shop: string,
  event: Stripe.Event
): Promise<void> {
  const charge = event.data.object as ChargeWithInvoice;
  await persistRiskFromCharge(shop, charge);
}
