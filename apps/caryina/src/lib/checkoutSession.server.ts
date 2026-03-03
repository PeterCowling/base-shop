import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { AxerveError, callPayment } from "@acme/axerve";
import { type CartState, validateCart } from "@acme/platform-core/cart";
import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { deleteCart, getCart } from "@acme/platform-core/cartStore";
import { sendSystemEmail } from "@acme/platform-core/email";
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

const SHOP = "caryina";
const CURRENCY = "eur";
const HOLD_TTL_SECONDS = 20 * 60;

const REQUIRED_CHECKOUT_FIELDS = [
  "idempotencyKey",
  "cardNumber",
  "expiryMonth",
  "expiryYear",
  "cvv",
] as const;

interface CheckoutFields {
  idempotencyKey: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  buyerName?: string;
  buyerEmail?: string;
}

interface CheckoutContext {
  checkout: CheckoutFields;
  cart: CartState;
  cartId?: string;
}

interface HoldContext extends CheckoutContext {
  holdId: string;
  totalCents: number;
  amountDecimal: string;
  shopTransactionId: string;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function parseCheckoutFields(body: Record<string, unknown>): CheckoutFields | null {
  for (const field of REQUIRED_CHECKOUT_FIELDS) {
    if (typeof body[field] !== "string" || !body[field]) {
      return null;
    }
  }

  const idempotencyKey = (body.idempotencyKey as string).trim();
  if (!idempotencyKey || idempotencyKey.length > 128) {
    return null;
  }

  return {
    idempotencyKey,
    cardNumber: body.cardNumber as string,
    expiryMonth: body.expiryMonth as string,
    expiryYear: body.expiryYear as string,
    cvv: body.cvv as string,
    buyerName: typeof body.buyerName === "string" ? body.buyerName : undefined,
    buyerEmail: typeof body.buyerEmail === "string" ? body.buyerEmail : undefined,
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
    cart: buildCartSnapshot(cart),
    card: {
      cardNumber: checkout.cardNumber,
      expiryMonth: checkout.expiryMonth,
      expiryYear: checkout.expiryYear,
      cvv: checkout.cvv,
      buyerName: checkout.buyerName ?? "",
      buyerEmail: checkout.buyerEmail ?? "",
    },
  });
}

function buildShopTransactionId(idempotencyKey: string, cartId?: string): string {
  const digest = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 24);
  return `caryina-${digest}-${cartId ?? "no-cart"}`;
}

function merchantEmail(): string {
  return process.env.MERCHANT_NOTIFY_EMAIL ?? "peter.cowling1976@gmail.com";
}

function dispatchMerchantOrderEmail(
  cart: CartState,
  totalCents: number,
  shopTransactionId: string,
  transactionId?: string,
): void {
  const itemLines = Object.values(cart)
    .map(
      (line) =>
        `<tr><td>${line.sku.title}</td><td>${line.qty}</td><td>€${(line.sku.price / 100).toFixed(2)}</td><td>€${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
    )
    .join("");
  const emailHtml = `
      <h2>New order received</h2>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
        <tbody>${itemLines}</tbody>
      </table>
      <p><strong>Total: €${(totalCents / 100).toFixed(2)}</strong></p>
      <p>Transaction ID: ${shopTransactionId}</p>
      <p>Axerve ref: ${transactionId ?? ""}</p>
    `;
  void sendSystemEmail({
    to: merchantEmail(),
    subject: `New order — ${shopTransactionId}`,
    html: emailHtml,
  }).catch((err: unknown) => {
    console.error("Merchant notification email failed", err); // i18n-exempt -- developer log
  });
}

function dispatchCustomerConfirmationEmail(
  checkout: CheckoutFields,
  cart: CartState,
  totalCents: number,
  shopTransactionId: string,
  transactionId?: string,
): void {
  const recipientEmail = checkout.buyerEmail?.trim();
  if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return;
  }

  const customerItemLines = Object.values(cart)
    .map(
      (line) =>
        `<tr><td>${escHtml(line.sku.title)}</td><td>${line.qty}</td><td>€${(line.sku.price / 100).toFixed(2)}</td><td>€${((line.sku.price * line.qty) / 100).toFixed(2)}</td></tr>`,
    )
    .join("");

  const emailHtml = `
      <h2>Order confirmed — thank you!</h2>
      <p>Hi${checkout.buyerName ? ` ${escHtml(checkout.buyerName)}` : ""},</p>
      <p>Your order has been received and payment processed successfully.</p>
      <table border="1" cellpadding="4" cellspacing="0">
        <thead><tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
        <tbody>${customerItemLines}</tbody>
      </table>
      <p><strong>Total: €${(totalCents / 100).toFixed(2)}</strong></p>
      <p>Order reference: ${shopTransactionId}</p>
      <p>Payment reference: ${transactionId ?? ""}</p>
      <p>If you have any questions, reply to this email or contact our support.</p>
    `;

  void sendSystemEmail({
    to: recipientEmail,
    subject: `Order confirmed — ${shopTransactionId}`,
    html: emailHtml,
  }).catch((err: unknown) => {
    console.error("Customer confirmation email failed", err); // i18n-exempt -- developer log
  });
}

async function sendCheckoutAlert(subject: string, html: string): Promise<void> {
  try {
    await sendSystemEmail({
      to: merchantEmail(),
      subject,
      html,
    });
  } catch (err) {
    console.error("Checkout alert email failed", err); // i18n-exempt -- developer log
  }
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
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const checkout = parseCheckoutFields(body);
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
    holdTtlSeconds: HOLD_TTL_SECONDS,
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

  await markCheckoutAttemptReservation({
    shopId: SHOP,
    idempotencyKey: context.checkout.idempotencyKey,
    holdId,
    shopTransactionId,
  });

  return {
    ok: true,
    holdContext: {
      ...context,
      holdId,
      totalCents,
      amountDecimal,
      shopTransactionId,
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
  );
  dispatchCustomerConfirmationEmail(
    holdContext.checkout,
    holdContext.cart,
    holdContext.totalCents,
    holdContext.shopTransactionId,
    transactionId,
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

  const hold = await createHoldContext(parsed.context);
  if (!hold.ok) {
    return hold.response;
  }

  return handlePaymentFlow(hold.holdContext);
}
