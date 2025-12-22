import type Stripe from "stripe";
import { prisma } from "../db";
import {
  persistRiskFromCharge,
  type ChargeWithInvoice,
} from "../internal/helpers/risk";

export default async function paymentIntentSucceeded(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const pi = event.data.object as Stripe.PaymentIntent;

  const stripeCustomerId =
    typeof pi.customer === "string" ? pi.customer : undefined;

  const latest = pi.latest_charge;
  const charge =
    latest && typeof latest !== "string"
      ? (latest as ChargeWithInvoice)
      : undefined;

  const chargeId = typeof latest === "string" ? latest : charge?.id;
  const balanceTxId =
    typeof charge?.balance_transaction === "string"
      ? charge.balance_transaction
      : charge?.balance_transaction?.id;

  if (typeof pi.id === "string" && pi.id.length) {
    await prisma.rentalOrder.updateMany({
      where: { shop, stripePaymentIntentId: pi.id },
      data: {
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(chargeId ? { stripeChargeId: chargeId } : {}),
        ...(balanceTxId ? { stripeBalanceTransactionId: balanceTxId } : {}),
      },
    });
  }
  if (charge) {
    await persistRiskFromCharge(shop, charge);
  }
}
