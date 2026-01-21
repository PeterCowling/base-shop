import type Stripe from "stripe";

import { prisma } from "../db";
import {
  type ChargeWithInvoice,
  persistRiskFromCharge,
} from "../internal/helpers/risk";

export default async function chargeSucceeded(
  shop: string,
  event: Stripe.Event,
): Promise<void> {
  const charge = event.data.object as ChargeWithInvoice;

  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  const balanceTxId =
    typeof charge.balance_transaction === "string"
      ? charge.balance_transaction
      : charge.balance_transaction?.id;
  const stripeCustomerId =
    typeof charge.customer === "string" ? charge.customer : undefined;

  if (piId) {
    await prisma.rentalOrder.updateMany({
      where: { shop, stripePaymentIntentId: piId },
      data: {
        stripeChargeId: charge.id,
        ...(balanceTxId ? { stripeBalanceTransactionId: balanceTxId } : {}),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      },
    });
  }

  await persistRiskFromCharge(shop, charge);
}
