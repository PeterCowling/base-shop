import type Stripe from "stripe";
import { markRefunded } from "../orders/refunds";
import { extractSessionIdFromCharge } from "./utils";
import type { ChargeWithInvoice } from "./utils";

export default async function chargeRefunded(
  shop: string,
  event: Stripe.Event
): Promise<void> {
  const charge = event.data.object as ChargeWithInvoice;
  const sessionId = extractSessionIdFromCharge(charge) || charge.id;
  await markRefunded(shop, sessionId);
}
