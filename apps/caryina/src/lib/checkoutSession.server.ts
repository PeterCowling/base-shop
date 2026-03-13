import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { AxerveError, callPayment } from "@acme/axerve";
import { type CartState, validateCart } from "@acme/platform-core/cart";
import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { deleteCart, getCart } from "@acme/platform-core/cartStore";
import { commitInventoryHold, releaseInventoryHold } from "@acme/platform-core/inventoryHolds";
import { recordMetric } from "@acme/platform-core/utils";

import {
  beginCheckoutAttempt,
  buildCheckoutRequestHash,
  markCheckoutAttemptPaymentAttempted,
  markCheckoutAttemptReservation,
  markCheckoutAttemptResult,
} from "./checkoutIdempotency.server";
import { reconcileStaleCheckoutAttempts } from "./checkoutReconciliation.server";
import {
  dispatchCustomerConfirmationEmail,
  dispatchMerchantOrderEmail,
  sendCheckoutAlert,
} from "./payments/notifications.server";
import {
  type CaryinaPaymentProvider,
  isAxerveProvider,
  resolveCaryinaPaymentProvider,
} from "./payments/provider.server";
import { createStripeCheckoutRedirect } from "./payments/stripeCheckout.server";
import { pmOrderDualWrite } from "./pmOrderDualWrite.server";

const SHOP = "caryina";
const CURRENCY = "eur";
const AXERVE_HOLD_TTL_SECONDS = 20 * 60;
const STRIPE_HOLD_TTL_SECONDS = 35 * 60;

const REQUIRED_CHECKOUT_FIELDS = ["idempotencyKey", "lang"] as const;
const REQUIRED_AXERVE_FIELDS = ["cardNumber", "expiryMonth", "expiryYear", "cvv"] as const;

interface BaseCheckoutFields {
  idempotencyKey: string;
  lang: string;
  acceptedLegalTerms: true;
  buyerName?: string;
  buyerEmail?: string;
}

interface AxerveCheckoutFields extends BaseCheckoutFields {
  provider: "axerve";
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

interface StripeCheckoutFields extends BaseCheckoutFields {
  provider: "stripe";
}

type CheckoutFields = AxerveCheckoutFields | StripeCheckoutFields;

interface CheckoutContext {
  checkout: CheckoutFields;
  cart: CartState;
  cartId?: string;
  provider: CaryinaPaymentProvider;
  origin: string;
}

interface HoldContext extends CheckoutContext {
  holdId: string;
  totalCents: number;
  amountDecimal: string;
  shopTransactionId: string;
  acceptedLegalTermsAt: string;
}

function isAxerveCheckout(checkout: CheckoutFields): checkout is AxerveCheckoutFields {
  return checkout.provider === "axerve";
}

function parseCheckoutFields(
  body: Record<string, unknown>,
  provider: CaryinaPaymentProvider,
): CheckoutFields | null {
  for (const field of REQUIRED_CHECKOUT_FIELDS) {
    if (typeof body[field] !== "string" || !body[field]) {
      return null;
    }
  }

  const idempotencyKey = (body.idempotencyKey as string).trim();
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return null;
  }

  const acceptedLegalTerms = body.acceptedLegalTerms === true;
  if (!acceptedLegalTerms) {
    return null;
  }

  const base: BaseCheckoutFields = {
    idempotencyKey,
    lang: body.lang as string,
    acceptedLegalTerms: true,
    buyerName: typeof body.buyerName === "string" ? body.buyerName : undefined,
    buyerEmail: typeof body.buyerEmail === "string" ? body.buyerEmail : undefined,
  };

  if (provider === "stripe") {
    return {
      ...base,
      provider: "stripe",
    };
  }

  for (const field of REQUIRED_AXERVE_FIELDS) {
    if (typeof body[field] !== "string" || !body[field]) {
      return null;
    }
  }

  return {
    ...base,
    provider: "axerve",
    cardNumber: body.cardNumber as string,
    expiryMonth: body.expiryMonth as string,
    expiryYear: body.expiryYear as string,
    cvv: body.cvv as string,
  };
}

function buildCartSnapshot(cart: CartState): Array<{
  sku: string;
  size: string;
  quantity: number;
  unitPrice: number;
}> {
  return Object.values(cart)
    .map((line) => ({
      sku: line.sku.id,
      size: line.size ?? "",
      quantity: line.qty,
      unitPrice: line.sku.price,
    }))
    .sort((a, b) => `${a.sku}:${a.size}`.localeCompare(`${b.sku}:${b.size}`));
}

function buildRequestHash(cart: CartState, checkout: CheckoutFields): string {
  return buildCheckoutRequestHash({
    version: 1,
    provider: checkout.provider,
    lang: checkout.lang,
    acceptedLegalTerms: checkout.acceptedLegalTerms,
    cart: buildCartSnapshot(cart),
    ...(isAxerveCheckout(checkout)
      ? {
          card: {
            cardNumber: checkout.cardNumber,
            expiryMonth: checkout.expiryMonth,
            expiryYear: checkout.expiryYear,
            cvv: checkout.cvv,
            buyerName: checkout.buyerName ?? "",
            buyerEmail: checkout.buyerEmail ?? "",
          },
        }
      : {}),
  });
}

function buildShopTransactionId(idempotencyKey: string, cartId?: string): string {
  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 24);
  return `caryina-${digest}-${cartId ?? "no-cart"}`;
}


async function releaseHoldSafely(
  holdId: string,
  idempotencyKey: string,
  shopTransactionId: string,
  reason: string,
): Promise<void> {
  try {
    const result = await releaseInventoryHold({
      shopId: SHOP,
      holdId,
      reason,
    });

    recordMetric("caryina_checkout_hold_lifecycle_total", {
      shopId: SHOP,
      service: "caryina",
      status: result.ok ? "success" : "failure",
      outcome: result.ok ? result.status : result.reason,
    });

    if (!result.ok && result.reason !== "not_found") {
      await sendCheckoutAlert(
        `[ALERT] Caryina hold release issue: ${idempotencyKey}`,
        `
          <p>Hold release returned non-ok state.</p>
          <p><strong>Reason:</strong> ${result.reason}</p>
          <p><strong>Hold ID:</strong> ${holdId}</p>
          <p><strong>Checkout key:</strong> ${idempotencyKey}</p>
          <p><strong>Transaction:</strong> ${shopTransactionId}</p>
        `,
      );
    }
  } catch (err) {
    recordMetric("caryina_checkout_hold_lifecycle_total", {
      shopId: SHOP,
      service: "caryina",
      status: "failure",
      outcome: "release_error",
    });
    console.error("Checkout hold release failed", { holdId, idempotencyKey, reason, err }); // i18n-exempt -- developer log
    await sendCheckoutAlert(
      `[ALERT] Caryina hold release failed: ${idempotencyKey}`,
      `
        <p>Hold release threw an exception.</p>
        <p><strong>Hold ID:</strong> ${holdId}</p>
        <p><strong>Checkout key:</strong> ${idempotencyKey}</p>
        <p><strong>Transaction:</strong> ${shopTransactionId}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      `,
    );
  }
}

async function failAttemptAndRespond(
  idempotencyKey: string,
  responseStatus: number,
  responseBody: Record<string, unknown>,
  errorCode?: string,
): Promise<NextResponse> {
  await markCheckoutAttemptResult({
    shopId: SHOP,
    idempotencyKey,
    status: "failed",
    responseStatus,
    responseBody,
    errorCode,
    errorMessage: typeof responseBody.error === "string" ? responseBody.error : undefined,
  });
  return NextResponse.json(responseBody, { status: responseStatus });
}

async function parseCheckoutContext(req: NextRequest): Promise<
  | { ok: true; context: CheckoutContext }
  | { ok: false; response: NextResponse }
> {
  const provider = resolveCaryinaPaymentProvider();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const checkout = parseCheckoutFields(body, provider);
  if (!checkout) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing required checkout fields" }, // i18n-exempt -- machine-readable API error
        { status: 400 },
      ),
    };
  }

  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const decodedCartId = decodeCartCookie(rawCookie);
  const cartId = typeof decodedCartId === "string" ? decodedCartId : undefined;
  const cart = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Cart is empty" }, { status: 400 }), // i18n-exempt -- machine-readable API error
    };
  }

  return {
    ok: true,
    context: {
      checkout,
      cart,
      cartId,
      provider,
      origin: req.nextUrl.origin,
    },
  };
}

async function handleIdempotencyGate(context: CheckoutContext): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const requestHash = buildRequestHash(context.cart, context.checkout);
  const attempt = await beginCheckoutAttempt({
    shopId: SHOP,
    idempotencyKey: context.checkout.idempotencyKey,
    requestHash,
  });

  if (attempt.kind === "replay") {
    recordMetric("caryina_checkout_idempotency_total", {
      shopId: SHOP,
      service: "caryina",
      status: "success",
      outcome: "replay",
    });
    const replay = NextResponse.json(attempt.responseBody, {
      status: attempt.responseStatus,
    });
    replay.headers.set("x-idempotent-replay", "1");
    return { ok: false, response: replay };
  }

  if (attempt.kind === "in_progress") {
    recordMetric("caryina_checkout_idempotency_total", {
      shopId: SHOP,
      service: "caryina",
      status: "failure",
      outcome: "in_progress",
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Checkout already in progress", // i18n-exempt -- machine-readable API error
          code: "idempotency_in_progress", // i18n-exempt -- machine-readable API code
        },
        { status: 409 },
      ),
    };
  }

  if (attempt.kind === "conflict") {
    recordMetric("caryina_checkout_idempotency_total", {
      shopId: SHOP,
      service: "caryina",
      status: "failure",
      outcome: "payload_mismatch",
    });
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Idempotency key already used with a different payload", // i18n-exempt -- machine-readable API error
          code: "idempotency_payload_mismatch", // i18n-exempt -- machine-readable API code
        },
        { status: 409 },
      ),
    };
  }

  recordMetric("caryina_checkout_idempotency_total", {
    shopId: SHOP,
    service: "caryina",
    status: "success",
    outcome: "acquired",
  });

  return { ok: true };
}

async function createHoldContext(context: CheckoutContext): Promise<
  | { ok: true; holdContext: HoldContext }
  | { ok: false; response: NextResponse }
> {
  const validation = await validateCart({
    shopId: SHOP,
    cart: context.cart,
    createHold: true,
    holdTtlSeconds: isAxerveProvider(context.provider)
      ? AXERVE_HOLD_TTL_SECONDS
      : STRIPE_HOLD_TTL_SECONDS,
    useCentralInventory: false,
  });

  if (!validation.valid) {
    if (validation.code === "INSUFFICIENT_STOCK") {
      recordMetric("caryina_checkout_stock_conflict_total", {
        shopId: SHOP,
        service: "caryina",
        status: "failure",
      });
      return {
        ok: false,
        response: await failAttemptAndRespond(
          context.checkout.idempotencyKey,
          409,
          {
            error: "Insufficient stock", // i18n-exempt -- machine-readable API error
            code: "inventory_insufficient", // i18n-exempt -- machine-readable API code
            items: validation.insufficientItems.map((item) => ({
              sku: item.sku,
              variantAttributes: item.variantAttributes,
              requested: item.requestedQuantity,
              available: item.availableQuantity,
            })),
          },
          "inventory_insufficient",
        ),
      };
    }

    const statusCode =
      validation.code === "INVENTORY_BUSY" || validation.code === "INVENTORY_UNAVAILABLE"
        ? 503
        : 409;

    return {
      ok: false,
      response: await failAttemptAndRespond(
        context.checkout.idempotencyKey,
        statusCode,
        {
          error:
            validation.code === "INVENTORY_BUSY" || validation.code === "INVENTORY_UNAVAILABLE"
              ? "Inventory backend unavailable"
              : "Inventory validation failed",
          code: validation.code.toLowerCase(),
        },
        validation.code.toLowerCase(),
      ),
    };
  }

  const holdId = validation.holdId;
  if (!holdId) {
    return {
      ok: false,
      response: await failAttemptAndRespond(
        context.checkout.idempotencyKey,
        503,
        {
          error: "Inventory hold creation failed", // i18n-exempt -- machine-readable API error
          code: "inventory_hold_missing", // i18n-exempt -- machine-readable API code
        },
        "inventory_hold_missing",
      ),
    };
  }

  const totalCents = Object.values(context.cart).reduce(
    (sum, line) => sum + line.sku.price * line.qty,
    0,
  );
  const amountDecimal = (totalCents / 100).toFixed(2);
  const shopTransactionId = buildShopTransactionId(
    context.checkout.idempotencyKey,
    context.cartId,
  );
  const acceptedLegalTermsAt = new Date().toISOString();

  await markCheckoutAttemptReservation({
    shopId: SHOP,
    idempotencyKey: context.checkout.idempotencyKey,
    holdId,
    shopTransactionId,
    acceptedLegalTerms: context.checkout.acceptedLegalTerms,
    acceptedLegalTermsAt,
    provider: context.provider,
    cartId: context.cartId,
    lang: context.checkout.lang,
    buyerName: context.checkout.buyerName,
    buyerEmail: context.checkout.buyerEmail,
  });

  return {
    ok: true,
    holdContext: {
      ...context,
      holdId,
      totalCents,
      amountDecimal,
      shopTransactionId,
      acceptedLegalTermsAt,
    },
  };
}

async function handleSuccessfulPayment(
  holdContext: HoldContext,
  transactionId?: string,
): Promise<NextResponse> {
  let needsReview = false;
  try {
    await commitInventoryHold({ shopId: SHOP, holdId: holdContext.holdId });
    recordMetric("caryina_checkout_hold_lifecycle_total", {
      shopId: SHOP,
      service: "caryina",
      status: "success",
      outcome: "committed",
    });
  } catch (err) {
    needsReview = true;
    recordMetric("caryina_checkout_hold_lifecycle_total", {
      shopId: SHOP,
      service: "caryina",
      status: "failure",
      outcome: "commit_error",
    });
    console.error("Checkout hold commit failed", { holdId: holdContext.holdId, err }); // i18n-exempt -- developer log
    await sendCheckoutAlert(
      `[ALERT] Caryina hold commit failed: ${holdContext.checkout.idempotencyKey}`,
      `
        <p>Inventory hold commit failed after successful payment.</p>
        <p><strong>Hold ID:</strong> ${holdContext.holdId}</p>
        <p><strong>Checkout key:</strong> ${holdContext.checkout.idempotencyKey}</p>
        <p><strong>Transaction:</strong> ${holdContext.shopTransactionId}</p>
      `,
    );
  }

  if (holdContext.cartId) {
    await deleteCart(holdContext.cartId);
  }

  dispatchMerchantOrderEmail(
    holdContext.cart,
    holdContext.totalCents,
    holdContext.shopTransactionId,
    transactionId,
    "Axerve ref",
  );
  dispatchCustomerConfirmationEmail(
    {
      buyerName: holdContext.checkout.buyerName,
      buyerEmail: holdContext.checkout.buyerEmail,
      cart: holdContext.cart,
      totalCents: holdContext.totalCents,
      shopTransactionId: holdContext.shopTransactionId,
      paymentReference: transactionId,
    },
  );

  const successBody = {
    success: true,
    transactionId,
    amount: holdContext.totalCents,
    currency: CURRENCY,
  };

  await markCheckoutAttemptResult({
    shopId: SHOP,
    idempotencyKey: holdContext.checkout.idempotencyKey,
    status: needsReview ? "needs_review" : "succeeded",
    responseStatus: 200,
    responseBody: successBody,
    ...(needsReview
      ? {
          errorCode: "hold_commit_failed",
          errorMessage: "Payment succeeded but hold commit failed",
        }
      : {}),
  });

  const response = NextResponse.json(successBody);
  response.headers.set(
    "Set-Cookie",
    `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`,
  );
  return response;
}

async function handlePaymentFlow(holdContext: HoldContext): Promise<NextResponse> {
  if (!isAxerveCheckout(holdContext.checkout)) {
    try {
      const stripeSession = await createStripeCheckoutRedirect(
        {
          cart: holdContext.cart,
          cartId: holdContext.cartId,
          totalCents: holdContext.totalCents,
          holdId: holdContext.holdId,
          shopTransactionId: holdContext.shopTransactionId,
          idempotencyKey: holdContext.checkout.idempotencyKey,
          lang: holdContext.checkout.lang,
          acceptedLegalTermsAt: holdContext.acceptedLegalTermsAt,
        },
        holdContext.origin,
      );

      const successBody = {
        success: true,
        mode: "redirect",
        provider: "stripe",
        sessionId: stripeSession.sessionId,
        url: stripeSession.url,
      };

      return NextResponse.json(successBody);
    } catch {
      await releaseHoldSafely(
        holdContext.holdId,
        holdContext.checkout.idempotencyKey,
        holdContext.shopTransactionId,
        "stripe_session_create_failed",
      );
      return failAttemptAndRespond(
        holdContext.checkout.idempotencyKey,
        502,
        { error: "Checkout failed" },
        "checkout_failed",
      );
    }
  }

  try {
    await markCheckoutAttemptPaymentAttempted({
      shopId: SHOP,
      idempotencyKey: holdContext.checkout.idempotencyKey,
    });

    const result = await callPayment({
      shopLogin: process.env.AXERVE_SHOP_LOGIN ?? "",
      apiKey: process.env.AXERVE_API_KEY ?? "",
      uicCode: "978",
      amount: holdContext.amountDecimal,
      shopTransactionId: holdContext.shopTransactionId,
      cardNumber: holdContext.checkout.cardNumber,
      expiryMonth: holdContext.checkout.expiryMonth,
      expiryYear: holdContext.checkout.expiryYear,
      cvv: holdContext.checkout.cvv,
      buyerName: holdContext.checkout.buyerName,
      buyerEmail: holdContext.checkout.buyerEmail,
    });

    if (!result.success) {
      await releaseHoldSafely(
        holdContext.holdId,
        holdContext.checkout.idempotencyKey,
        holdContext.shopTransactionId,
        "payment_declined",
      );
      return failAttemptAndRespond(
        holdContext.checkout.idempotencyKey,
        402,
        {
          success: false,
          error: result.errorDescription ?? "Payment declined",
        },
        "payment_declined",
      );
    }

    return handleSuccessfulPayment(holdContext, result.transactionId);
  } catch (err) {
    const errorCode =
      err instanceof AxerveError ? "payment_service_unavailable" : "checkout_failed";
    const statusCode = err instanceof AxerveError ? 502 : 500;
    const reason =
      err instanceof AxerveError ? "payment_service_unavailable" : "payment_unexpected_error";

    await releaseHoldSafely(
      holdContext.holdId,
      holdContext.checkout.idempotencyKey,
      holdContext.shopTransactionId,
      reason,
    );

    return failAttemptAndRespond(
      holdContext.checkout.idempotencyKey,
      statusCode,
      {
        error: err instanceof AxerveError ? "Payment service unavailable" : "Checkout failed",
      },
      errorCode,
    );
  }
}

export async function handleCheckoutSessionRequest(
  req: NextRequest,
): Promise<NextResponse> {
  if (process.env.CARYINA_CHECKOUT_AUTO_RECONCILE === "1") {
    void reconcileStaleCheckoutAttempts({ shopId: SHOP, maxAttempts: 5 }).catch((err) => {
      console.error("Auto checkout reconciliation failed", err); // i18n-exempt -- developer log
    });
  }

  const parsed = await parseCheckoutContext(req);
  if (!parsed.ok) {
    return parsed.response;
  }

  const idempotency = await handleIdempotencyGate(parsed.context);
  if (!idempotency.ok) {
    return idempotency.response;
  }

  // TC-04-02: Fire-and-forget dual-write to Payment Manager order table.
  // Never blocks checkout — errors are logged at warn level and swallowed.
  {
    const { checkout, cart, provider } = parsed.context;
    const totalCents = Object.values(cart).reduce(
      (sum, line) => sum + (line.sku.price ?? 0) * line.qty,
      0,
    );
    const lineItems = Object.values(cart).map((line) => ({
      productId: line.sku.id ?? undefined,
      sku: line.sku.title ?? undefined,
      qty: line.qty,
      unitCents: line.sku.price ?? undefined,
    }));
    void pmOrderDualWrite({
      id: checkout.idempotencyKey,
      shopId: SHOP,
      provider: provider as string,
      status: "pending",
      amountCents: totalCents,
      currency: CURRENCY.toUpperCase(),
      customerEmail: checkout.buyerEmail,
      lineItemsJson: lineItems,
    }).catch((err: unknown) => {
      console.warn("[pm_dual_write_failed]", err); // i18n-exempt -- developer log
    });
  }

  const hold = await createHoldContext(parsed.context);
  if (!hold.ok) {
    return hold.response;
  }

  return handlePaymentFlow(hold.holdContext);
}
