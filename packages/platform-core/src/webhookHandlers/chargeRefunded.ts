import type Stripe from "stripe";

import {
  type ChargeWithInvoice,
  extractSessionIdFromCharge,
} from "../internal/helpers/risk";
import { markRefunded } from "../orders/refunds";

export default async function chargeRefunded(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const charge = event.data.object as ChargeWithInvoice;
  const sessionId = extractSessionIdFromCharge(charge) || charge.id;
  await markRefunded(shop, sessionId);
}
