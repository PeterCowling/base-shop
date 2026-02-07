import type Stripe from "stripe";

import { updateRisk } from "../orders/risk";

export default async function reviewOpened(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const review = event.data.object as Stripe.Review;
  const charge = review.charge;
  const chargeId = typeof charge === "string" ? charge : charge?.id;
  if (chargeId) {
    await updateRisk(shop, chargeId, undefined, undefined, true);
  }
}
