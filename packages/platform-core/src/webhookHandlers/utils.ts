import type Stripe from "stripe";
import { updateRisk } from "../orders/risk";

export type ChargeWithInvoice = Stripe.Charge & {
  invoice?: string | Stripe.Invoice | null;
};

export type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

export function extractSessionIdFromCharge(charge: ChargeWithInvoice): string | undefined {
  if (typeof charge.invoice === "string") return charge.invoice;
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

export async function persistRiskFromCharge(shop: string, charge: ChargeWithInvoice) {
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
