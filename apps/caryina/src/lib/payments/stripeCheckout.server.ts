import "server-only";

import { type CartState } from "@acme/platform-core/cart";
import { deleteCart, getCart } from "@acme/platform-core/cartStore";
import { commitInventoryHold, releaseInventoryHold } from "@acme/platform-core/inventoryHolds";
import { stripe } from "@acme/stripe";

import {
  beginStripeCheckoutFinalization,
  type CheckoutAttemptRecord,
  findCheckoutAttemptByStripeSessionId,
  markCheckoutAttemptResult,
  recordCheckoutAttemptStripeSession,
} from "@/lib/checkoutIdempotency.server";
import {
  dispatchCustomerConfirmationEmail,
  dispatchMerchantOrderEmail,
  sendCheckoutAlert,
} from "@/lib/payments/notifications.server";
import { pmOrderDualWrite } from "@/lib/pmOrderDualWrite.server";

const SHOP = "caryina";
const STRIPE_SESSION_TTL_SECONDS = 30 * 60;

type StripeCheckoutContext = {
  cart: CartState;
  cartId?: string;
  totalCents: number;
  holdId: string;
  shopTransactionId: string;
  idempotencyKey: string;
  lang: string;
  acceptedLegalTermsAt?: string;
};

type StripeVerifyResult = {
  paid: boolean;
  amount?: number;
  currency?: string;
  cartId?: string;
  shopTransactionId?: string;
  sessionId: string;
  paymentIntentId?: string;
  buyerName?: string;
  buyerEmail?: string;
};

type StripeFinalizeResult =
  | ({ state: "finalized" } & StripeVerifyResult)
  | ({ state: "processing" } & StripeVerifyResult)
  | ({ state: "not_paid" } & StripeVerifyResult);

function buildStripeFinalizeState(
  state: StripeFinalizeResult["state"],
  verified: StripeVerifyResult,
): StripeFinalizeResult {
  return { state, ...verified };
}

async function completeStripeFinalization(params: {
  attempt: CheckoutAttemptRecord;
  verified: StripeVerifyResult;
  sessionId: string;
}): Promise<void> {
  const { attempt, verified, sessionId } = params;
  const cart = attempt.cartId ? await getCart(attempt.cartId) : {};
  const totalCents =
    verified.amount ??
    Object.values(cart).reduce((sum, line) => sum + line.sku.price * line.qty, 0);

  if (attempt.holdId) {
    await commitInventoryHold({ shopId: SHOP, holdId: attempt.holdId });
  }

  if (attempt.cartId) {
    await deleteCart(attempt.cartId);
  }

  if (Object.keys(cart).length) {
    dispatchMerchantOrderEmail(
      cart,
      totalCents,
      attempt.shopTransactionId ?? verified.shopTransactionId ?? sessionId,
      verified.paymentIntentId ?? verified.sessionId,
      "Stripe ref",
    );
    dispatchCustomerConfirmationEmail({
      buyerName: attempt.buyerName ?? verified.buyerName,
      buyerEmail: attempt.buyerEmail ?? verified.buyerEmail,
      cart,
      totalCents,
      shopTransactionId: attempt.shopTransactionId ?? verified.shopTransactionId ?? sessionId,
      paymentReference: verified.paymentIntentId ?? verified.sessionId,
    });
  }

  await markCheckoutAttemptResult({
    shopId: SHOP,
    idempotencyKey: attempt.idempotencyKey,
    status: "succeeded",
    responseStatus: 200,
    responseBody: {
      success: true,
      sessionId: verified.sessionId,
      transactionId: verified.paymentIntentId ?? verified.sessionId,
      amount: totalCents,
      currency: verified.currency ?? "eur",
    },
  });

  // TC-04-02 follow-up: fire-and-forget status update — mark order "completed" in PM.
  // The initial dual-write (at checkout session creation) created the row with status
  // "pending". PM's refund route hard-blocks on status !== "completed", so this write is
  // required before any refund can be issued.
  void pmOrderDualWrite({
    id: attempt.idempotencyKey,
    shopId: SHOP,
    provider: "stripe",
    status: "completed",
    amountCents: totalCents,
    currency: verified.currency?.toUpperCase() ?? "EUR",
    customerEmail: attempt.buyerEmail ?? verified.buyerEmail,
    providerOrderId: verified.paymentIntentId ?? verified.sessionId,
  }).catch((err: unknown) => {
    console.warn("[pm_dual_write_completed_failed]", { // i18n-exempt -- developer log
      orderId: attempt.idempotencyKey,
      shopId: SHOP,
      error: err instanceof Error ? err.message : String(err),
    });
  });
}

async function markStripeCheckoutNeedsReview(params: {
  attemptIdempotencyKey: string;
  verified: StripeVerifyResult;
  error: unknown;
}): Promise<void> {
  await markCheckoutAttemptResult({
    shopId: SHOP,
    idempotencyKey: params.attemptIdempotencyKey,
    status: "needs_review",
    responseStatus: 503,
    responseBody: {
      error: "Stripe checkout requires manual reconciliation",
      code: "checkout_needs_review",
    },
    errorCode: "checkout_needs_review",
    errorMessage:
      params.error instanceof Error ? params.error.message : "Stripe finalization failed",
  });
  await sendCheckoutAlert(
    `[ALERT] Caryina Stripe checkout needs review: ${params.attemptIdempotencyKey}`,
    `
      <p>Stripe checkout finalization failed.</p>
      <p><strong>Idempotency key:</strong> ${params.attemptIdempotencyKey}</p>
      <p><strong>Session ID:</strong> ${params.verified.sessionId}</p>
      <p><strong>Payment intent:</strong> ${params.verified.paymentIntentId ?? "(none)"}</p>
    `,
  );
}

export async function createStripeCheckoutRedirect(
  context: StripeCheckoutContext,
  origin: string,
): Promise<{ sessionId: string; url: string }> {
  const expiresAt = Math.floor(Date.now() / 1000) + STRIPE_SESSION_TTL_SECONDS;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: Object.values(context.cart).map((line) => ({
        price_data: {
          currency: "eur",
          unit_amount: line.sku.price,
          product_data: { name: String(line.sku.title) },
        },
        quantity: line.qty,
      })),
      success_url: `${origin}/${context.lang}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${context.lang}/cancelled`,
      expires_at: expiresAt,
      metadata: {
        shop_id: SHOP,
        cart_id: context.cartId ?? "",
        inventory_reservation_id: context.holdId,
        caryina_checkout_idempotency_key: context.idempotencyKey,
        caryina_shop_transaction_id: context.shopTransactionId,
        caryina_legal_terms_accepted: "true",
        caryina_legal_terms_accepted_at: context.acceptedLegalTermsAt ?? "",
      },
    },
    { idempotencyKey: context.idempotencyKey },
  );

  if (typeof session.url !== "string" || !session.url) {
    throw new Error("Stripe checkout URL missing"); // i18n-exempt -- developer error
  }

  await recordCheckoutAttemptStripeSession({
    shopId: SHOP,
    idempotencyKey: context.idempotencyKey,
    stripeSessionId: session.id,
    stripeSessionExpiresAt: new Date(expiresAt * 1000).toISOString(),
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function verifyStripeSession(
  sessionId: string,
): Promise<StripeVerifyResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  return {
    paid: session.payment_status === "paid",
    amount: session.amount_total ?? undefined,
    currency: session.currency ?? undefined,
    cartId: session.metadata?.cart_id || undefined,
    shopTransactionId: session.metadata?.caryina_shop_transaction_id || undefined,
    sessionId: session.id,
    paymentIntentId,
    buyerName: session.customer_details?.name ?? undefined,
    buyerEmail:
      session.customer_details?.email ?? session.customer_email ?? undefined,
  };
}

export async function finalizeStripeSession(
  sessionId: string,
): Promise<StripeFinalizeResult> {
  const verified = await verifyStripeSession(sessionId);
  if (!verified.paid) {
    return buildStripeFinalizeState("not_paid", verified);
  }

  const reservation = await beginStripeCheckoutFinalization({
    shopId: SHOP,
    stripeSessionId: sessionId,
    stripePaymentIntentId: verified.paymentIntentId,
  });

  if (reservation.kind === "already_finalized") {
    return buildStripeFinalizeState("finalized", verified);
  }

  if (reservation.kind === "busy") {
    return buildStripeFinalizeState("processing", verified);
  }

  if (reservation.kind === "no_match") {
    return buildStripeFinalizeState("finalized", verified);
  }

  try {
    await completeStripeFinalization({
      attempt: reservation.record,
      verified,
      sessionId,
    });
    return buildStripeFinalizeState("finalized", verified);
  } catch (err) {
    await markStripeCheckoutNeedsReview({
      attemptIdempotencyKey: reservation.record.idempotencyKey,
      verified,
      error: err,
    });
    return buildStripeFinalizeState("processing", verified);
  }
}

export async function expireStripeSession(sessionId: string): Promise<void> {
  const attempt = await findCheckoutAttemptByStripeSessionId({
    shopId: SHOP,
    stripeSessionId: sessionId,
  });
  if (!attempt || attempt.status === "succeeded") {
    return;
  }

  if (attempt.holdId) {
    await releaseInventoryHold({
      shopId: SHOP,
      holdId: attempt.holdId,
      reason: "stripe_checkout_expired",
    });
  }

  await markCheckoutAttemptResult({
    shopId: SHOP,
    idempotencyKey: attempt.idempotencyKey,
    status: "failed",
    responseStatus: 402,
    responseBody: {
      success: false,
      error: "Checkout expired",
    },
    errorCode: "checkout_expired",
    errorMessage: "Stripe hosted checkout session expired",
  });
}
