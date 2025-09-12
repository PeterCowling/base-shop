// packages/platform-core/src/stripe-webhook.ts
import type Stripe from "stripe";
import { stripe } from "@acme/stripe";
import { addOrder } from "./orders/creation";
import { markRefunded } from "./orders/refunds";
import { markNeedsAttention, updateRisk } from "./orders/risk";
import { getShopSettings } from "./repositories/settings.server";
import {
  syncSubscriptionData,
  updateSubscriptionPaymentStatus,
} from "./repositories/subscriptions.server";
import {
  extractSessionIdFromCharge,
  persistRiskFromCharge,
  type ChargeWithInvoice,
} from "./helpers/risk";

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

export { extractSessionIdFromCharge };

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
    case "payment_intent.payment_failed": {
      const pi = data.object as Stripe.PaymentIntent;
      const latest = pi.latest_charge;
      const charge =
        latest && typeof latest !== "string"
          ? (latest as ChargeWithInvoice)
          : undefined;
      const sessionId = charge
        ? extractSessionIdFromCharge(charge) || charge.id
        : pi.id;
      await markNeedsAttention(shop, sessionId);
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
    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = data.object as InvoiceWithSubscription;
      const customer = invoice.customer as string | Stripe.Customer | null;
      const subscription = invoice.subscription;
      const customerId =
        typeof customer === "string" ? customer : customer?.id;
      const subscriptionId =
        typeof subscription === "string" ? subscription : subscription?.id;
      if (customerId && subscriptionId) {
        await updateSubscriptionPaymentStatus(
          customerId,
          subscriptionId,
          type === "invoice.payment_succeeded" ? "succeeded" : "failed",
        );
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = data.object as Stripe.Subscription;
      const customer = subscription.customer as string | Stripe.Customer;
      const customerId = typeof customer === "string" ? customer : customer.id;
      await syncSubscriptionData(customerId, subscription.id);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = data.object as Stripe.Subscription;
      const customer = subscription.customer as string | Stripe.Customer;
      const customerId = typeof customer === "string" ? customer : customer.id;
      await syncSubscriptionData(customerId, null);
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
