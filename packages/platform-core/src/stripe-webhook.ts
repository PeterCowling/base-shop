// packages/platform-core/src/stripe-webhook.ts
import type Stripe from "stripe";
import { stripe } from "@acme/stripe";
import { addOrder, markRefunded, updateRisk } from "./orders";
import { getShopSettings } from "./repositories/settings.server";

type ChargeWithInvoice = Stripe.Charge & {
  invoice?: string | Stripe.Invoice | null;
};

function extractSessionIdFromCharge(charge: ChargeWithInvoice): string | undefined {
  if (charge.invoice) return charge.invoice as string;
  if (typeof charge.payment_intent !== "string" && charge.payment_intent) {
    const pi = charge.payment_intent as Stripe.PaymentIntent & {
      latest_charge?: string | ChargeWithInvoice | null;
    };
    const latest = pi.latest_charge;
    if (latest && typeof latest !== "string") {
      return typeof latest.invoice === "string" ? latest.invoice : undefined;
    }
  }
  return undefined;
}

async function persistRiskFromCharge(shop: string, charge: ChargeWithInvoice) {
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
      await addOrder(shop, session.id, deposit, returnDate, customerId);

      const settings = await getShopSettings(shop);
      const threshold = settings.luxuryFeatures.fraudReviewThreshold;
      const requireSCA = settings.luxuryFeatures.requireStrongCustomerAuth;
      if (deposit > threshold) {
        const piId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (piId) {
          const reviews = stripe.reviews as unknown as {
            create: (params: { payment_intent: string }) => Promise<unknown>;
          };
          await reviews.create({ payment_intent: piId });
          if (requireSCA) {
            await stripe.paymentIntents.update(piId, {
              payment_method_options: {
                card: { request_three_d_secure: "any" },
              },
            });
          }
        }
        await updateRisk(shop, session.id, undefined, undefined, true);
      }
      break;
    }
    case "charge.refunded": {
      const charge = data.object as ChargeWithInvoice;
      const sessionId = extractSessionIdFromCharge(charge) || charge.id;
      await markRefunded(shop, sessionId);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = data.object as Stripe.PaymentIntent;
      const latest = pi.latest_charge;
      const charge =
        latest && typeof latest !== "string"
          ? (latest as ChargeWithInvoice)
          : undefined;
      if (charge) {
        await persistRiskFromCharge(shop, charge);
      }
      break;
    }
    case "charge.succeeded": {
      const charge = data.object as ChargeWithInvoice;
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
        const warning = data.object as Stripe.Radar.EarlyFraudWarning;
        const chargeRef = warning.charge;
        const chargeId = typeof chargeRef === "string" ? chargeRef : chargeRef?.id;
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
            true
          );
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
