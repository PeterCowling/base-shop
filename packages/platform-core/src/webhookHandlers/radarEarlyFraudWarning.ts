import type Stripe from "stripe";
import { stripe } from "@acme/stripe";
import { markRefunded } from "../orders/refunds";
import { updateRisk } from "../orders/risk";

export default async function radarEarlyFraudWarning(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const warning = event.data.object as Stripe.Radar.EarlyFraudWarning;
  const chargeRef = warning.charge;
  const chargeId =
    typeof chargeRef === "string" ? chargeRef : chargeRef?.id;
  if (chargeId) {
    const charge =
      typeof chargeRef === "string"
        ? await stripe.charges.retrieve(chargeId)
        : chargeRef;
    const riskLevel = charge.outcome?.risk_level;
    const riskScore = charge.outcome?.risk_score;
    await updateRisk(
      shop,
      chargeId,
      riskLevel,
      typeof riskScore === "number" ? riskScore : undefined,
      true,
    );
    if (
      riskLevel === "highest" ||
      (typeof riskScore === "number" && riskScore > 75)
    ) {
      await markRefunded(shop, chargeId);
    }
  }
}
