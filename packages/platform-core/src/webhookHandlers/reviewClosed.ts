import type Stripe from "stripe";

import { updateRisk } from "../orders/risk";

export default async function reviewClosed(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const review = event.data.object as Stripe.Review;
  const charge = review.charge as Stripe.Charge | string | null;
  const chargeId = typeof charge === "string" ? charge : charge?.id;
  if (chargeId) {
    const outcome = typeof charge === "string" ? undefined : charge?.outcome;
    const riskLevel = outcome?.risk_level;
    const riskScore = outcome?.risk_score;
    await updateRisk(
      shop,
      chargeId,
      riskLevel,
      typeof riskScore === "number" ? riskScore : undefined,
      false,
    );
  }
}
