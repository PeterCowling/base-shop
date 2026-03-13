import "server-only";

import { stripe } from "@acme/stripe";

import { findCheckoutAttemptByShopTransactionId } from "@/lib/checkoutIdempotency.server";

const SHOP = "caryina";

export async function refundStripePayment(params: {
  shopTransactionId?: string;
  amountCents: number;
}): Promise<{ success: boolean; transactionId: string; bankTransactionId: string }> {
  const shopTransactionId = params.shopTransactionId?.trim();
  if (!shopTransactionId) {
    throw new Error("Stripe refunds require shopTransactionId"); // i18n-exempt -- developer error
  }

  const attempt = await findCheckoutAttemptByShopTransactionId({
    shopId: SHOP,
    shopTransactionId,
  });
  if (!attempt?.stripePaymentIntentId) {
    throw new Error("Stripe payment reference not found"); // i18n-exempt -- developer error
  }

  const refund = await stripe.refunds.create({
    payment_intent: attempt.stripePaymentIntentId,
    amount: params.amountCents,
  });

  return {
    success: true,
    transactionId: refund.id,
    bankTransactionId: attempt.stripePaymentIntentId,
  };
}
