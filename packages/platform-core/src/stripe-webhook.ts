// packages/platform-core/src/stripe-webhook.ts
import type Stripe from "stripe";
import { addOrder, markRefunded, updateRisk } from "./orders";

function extractSessionIdFromCharge(charge: Stripe.Charge): string | undefined {
  if (charge.invoice) return charge.invoice as string;
  if (typeof charge.payment_intent !== "string" && charge.payment_intent) {
    const pi = charge.payment_intent as Stripe.PaymentIntent & {
      charges?: { data?: Array<{ invoice?: string | null }> };
    };
    return pi.charges?.data?.[0]?.invoice || undefined;
  }
  return undefined;
}

async function persistRiskFromCharge(shop: string, charge: Stripe.Charge) {
  const sessionId = extractSessionIdFromCharge(charge) || charge.id;
  const riskLevel = charge.outcome?.risk_level;
  const riskScore = charge.outcome?.risk_score;
  await updateRisk(
    shop,
    sessionId,
    riskLevel,
    typeof riskScore === "number" ? riskScore : undefined
  );
}

export async function handleStripeWebhook(
  shop: string,
  event: Stripe.Event
): Promise<void> {
  const { type, data } = event;
  switch (type) {
    case "checkout.session.completed": {
      const session = data.object as Stripe.Checkout.Session;
      const deposit = Number(session.metadata?.depositTotal ?? 0);
      const returnDate = session.metadata?.returnDate || undefined;
      const customerId = session.metadata?.customerId || undefined;
      await addOrder(
        shop,
        session.id,
        deposit,
        returnDate,
        undefined,
        customerId,
      );
      break;
    }
    case "charge.refunded": {
      const charge = data.object as Stripe.Charge;
      const sessionId = extractSessionIdFromCharge(charge) || charge.id;
      await markRefunded(shop, sessionId);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = data.object as Stripe.PaymentIntent;
      const charge = pi.charges?.data?.[0];
      if (charge) {
        await persistRiskFromCharge(shop, charge);
      }
      break;
    }
    case "charge.succeeded": {
      const charge = data.object as Stripe.Charge;
      await persistRiskFromCharge(shop, charge);
      break;
    }
    case "review.opened": {
      const review = data.object as Stripe.Review;
      const charge = review.charge;
      const chargeId = typeof charge === "string" ? charge : charge?.id;
      if (chargeId) {
        await updateRisk(shop, chargeId, undefined, undefined, true);
      }
      break;
    }
    case "review.closed": {
      const review = data.object as Stripe.Review;
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
          false
        );
      }
      break;
    }
    default: {
      if (type.startsWith("radar.early_fraud_warning.")) {
        const warning = data.object as any; // Stripe.Radar.EarlyFraudWarning
        const chargeId =
          typeof warning.charge === "string" ? warning.charge : warning.charge?.id;
        if (chargeId) {
          const riskLevel = warning.risk_level as string | undefined;
          const riskScore = warning.risk_score as number | undefined;
          await updateRisk(shop, chargeId, riskLevel, riskScore, true);
          if (
            riskLevel === "highest" ||
            (typeof riskScore === "number" && riskScore > 75)
          ) {
            await markRefunded(shop, chargeId);
          }
        }
      }
      break;
    }
  }
}
