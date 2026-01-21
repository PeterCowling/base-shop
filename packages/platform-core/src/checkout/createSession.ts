import { createHash } from "crypto";
import type Stripe from "stripe";

import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";

import { trackEvent } from "../analytics";
import type { CartState } from "../cart";
import { findCoupon } from "../coupons";
import { incrementOperationalError } from "../shops/health";
import { getTaxRate } from "../tax";
import { recordMetric } from "../utils";

import {
  buildLineItemsForItem,
  buildSaleLineItemsForItem,
} from "./lineItems";
import { buildCheckoutMetadata } from "./metadata";
import { computeSaleTotals,computeTotals } from "./totals";

export interface CreateCheckoutSessionOptions {
  /**
   * Checkout flow kind.
   * "rental" uses rental duration + deposit semantics,
   * "sale" charges SKU prices directly without deposits.
   * Defaults to "rental" for backward compatibility.
   */
  mode?: "rental" | "sale";
  returnDate?: string;
  coupon?: string;
  currency: string;
  taxRegion: string;
  internalCustomerId?: string;
  stripeCustomerId?: string;
  shipping?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.Shipping;
  billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
  returnUrl: string;
  cartId?: string;
  clientIp?: string;
  shopId: string;
  lineItemsExtra?: Stripe.Checkout.SessionCreateParams.LineItem[];
  metadataExtra?: Record<string, string>;
  subtotalExtra?: number;
  depositAdjustment?: number;
  orderId?: string;
  orderNumber?: string;
  environment?: string;
  taxMode?: string;
  inventoryReservationId?: string;
  skipInventoryValidation?: boolean;
}

export const INSUFFICIENT_STOCK_ERROR = "Insufficient stock";

type InventoryLine = {
  skuId: string;
  qty: number;
  size: string;
  price: number;
  deposit: number;
};

function buildInventorySnapshot(cart: CartState): InventoryLine[] {
  return Object.values(cart)
    .map((line) => ({
      skuId: line.sku.id,
      qty: line.qty,
      size: line.size ?? "",
      price: line.sku.price,
      deposit: line.sku.deposit,
    }))
    .sort((a, b) => {
      const left = `${a.skuId}:${a.size}`;
      const right = `${b.skuId}:${b.size}`;
      return left.localeCompare(right);
    });
}

function assertInventoryAvailable(cart: CartState): void {
  for (const line of Object.values(cart)) {
    const stock = Number(line.sku.stock) || 0;
    if (stock <= 0 || line.qty > stock) {
      throw new Error(INSUFFICIENT_STOCK_ERROR);
    }
  }
}

function buildCheckoutIdempotencyKey(params: {
  shopId: string;
  cartId?: string;
  mode: "rental" | "sale";
  returnDate?: string;
  coupon?: string;
  currency: string;
  taxRegion: string;
  internalCustomerId?: string;
  stripeCustomerId?: string;
  lineItemsExtra: Stripe.Checkout.SessionCreateParams.LineItem[];
  metadataExtra: Record<string, string>;
  subtotalExtra: number;
  depositAdjustment: number;
  shipping?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.Shipping;
  billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
  cart: CartState;
}): string {
  const {
    shopId,
    cartId,
    mode,
    returnDate,
    coupon,
    currency,
    taxRegion,
    internalCustomerId,
    stripeCustomerId,
    lineItemsExtra,
    metadataExtra,
    subtotalExtra,
    depositAdjustment,
    shipping,
    billing_details,
    cart,
  } = params;

  const extraLines = lineItemsExtra.map((item) => ({
    quantity: item.quantity ?? 1,
    price: item.price ?? "",
    price_data: item.price_data
      ? {
          currency: item.price_data.currency,
          unit_amount: item.price_data.unit_amount,
          product_name: item.price_data.product_data?.name ?? "",
        }
      : undefined,
  }));

  const payload = {
    shopId,
    cartId: cartId ?? "",
    mode,
    returnDate: returnDate ?? "",
    coupon: coupon ?? "",
    currency,
    taxRegion,
    internalCustomerId: internalCustomerId ?? "",
    stripeCustomerId: stripeCustomerId ?? "",
    inventory: buildInventorySnapshot(cart),
    lineItemsExtra: extraLines,
    metadataExtra,
    subtotalExtra,
    depositAdjustment,
    shipping,
    billing_details,
  };

  const hash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `checkout_${hash}`;
}

/**
 * High level helper to create a Stripe checkout session for a cart.
 * Currency and shop ID are injected via function parameters.
 */
export async function createCheckoutSession(
  cart: CartState,
  {
    mode = "rental",
    returnDate,
    coupon,
    currency,
    taxRegion,
    internalCustomerId,
    stripeCustomerId,
    shipping,
    billing_details,
    returnUrl,
    cartId,
    clientIp,
    shopId,
    lineItemsExtra = [],
    metadataExtra = {},
    subtotalExtra = 0,
    depositAdjustment = 0,
    orderId,
    orderNumber,
    environment,
    taxMode,
    inventoryReservationId,
    skipInventoryValidation = false,
  }: CreateCheckoutSessionOptions
): Promise<{
  sessionId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  paymentIntentId?: string;
  orderId?: string;
}> {
  try {
    if (!skipInventoryValidation) {
      assertInventoryAvailable(cart);
    }
    const couponDef = await findCoupon(shopId, coupon);
    if (couponDef) {
      await trackEvent(shopId, {
        type: "discount_redeemed",
        code: couponDef.code,
      });
    }

    const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
    let rentalDays = 0;
    let effectiveReturnDate: string | undefined = returnDate;

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[];
    let subtotal: number;
    let depositTotal: number;
    let discount: number;

    if (mode === "sale") {
      const lineItemsNested = await Promise.all(
        Object.values(cart).map((item) =>
          buildSaleLineItemsForItem(item, discountRate, currency),
        ),
      );
      line_items = lineItemsNested.flat();
      if (lineItemsExtra.length) {
        line_items = line_items.concat(lineItemsExtra);
      }

      const totals = await computeSaleTotals(cart, discountRate, currency);
      ({ subtotal, depositTotal, discount } = totals);
      subtotal += subtotalExtra;
      // Deposit totals are always zero for sale flows; depositAdjustment is ignored.
      depositTotal = 0;
      rentalDays = 0;
      effectiveReturnDate = undefined;
    } else {
      try {
        rentalDays = calculateRentalDays(returnDate);
      } catch {
        throw new Error("Invalid returnDate"); // i18n-exempt -- Internal validation error surfaced to logs/UI
      }
      if (rentalDays <= 0) {
        throw new Error("Invalid returnDate"); // i18n-exempt -- Internal validation error surfaced to logs/UI
      }

      const lineItemsNested = await Promise.all(
        Object.values(cart).map((item) =>
          buildLineItemsForItem(item, rentalDays, discountRate, currency),
        ),
      );
      line_items = lineItemsNested.flat();
      if (lineItemsExtra.length) {
        line_items = line_items.concat(lineItemsExtra);
      }

      const totals = await computeTotals(
        cart,
        rentalDays,
        discountRate,
        currency,
      );
      ({ subtotal, depositTotal, discount } = totals);
      subtotal += subtotalExtra;
      depositTotal += depositAdjustment;
    }

    const taxRate = await getTaxRate(taxRegion);
    const taxAmountCents = Math.round(subtotal * taxRate * 100);
    const taxAmount = taxAmountCents / 100;
    if (taxAmountCents > 0) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: taxAmountCents,
          product_data: { name: "Tax" }, // i18n-exempt -- Stripe product label, not user copy
        },
        quantity: 1,
      });
    }

    const sizesMeta = JSON.stringify(
      Object.fromEntries(
        Object.values(cart).map((item) => [item.sku.id, item.size ?? ""]),
      ),
    );

    const metadata = buildCheckoutMetadata({
      shopId,
      cartId,
      orderId,
      orderNumber,
      internalCustomerId,
      stripeCustomerId,
      subtotal,
      depositTotal,
      returnDate: effectiveReturnDate,
      rentalDays,
      discount,
      coupon: couponDef?.code,
      currency,
      taxRate,
      taxAmount,
      taxMode: taxMode ?? "static_rates",
      environment: environment ?? process.env.NODE_ENV ?? "",
      inventoryReservationId,
      clientIp,
      sizes: sizesMeta,
      extra: metadataExtra,
    });

    const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData & {
      payment_method_options: {
        card: { request_three_d_secure: "automatic" };
      };
      billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
    } = {
      ...(shipping ? { shipping } : {}),
      payment_method_options: {
        card: { request_three_d_secure: "automatic" },
      },
      metadata,
    };

    if (billing_details) {
      paymentIntentData.billing_details = billing_details;
    }

    const idempotencyKey = buildCheckoutIdempotencyKey({
      shopId,
      cartId,
      mode,
      returnDate: effectiveReturnDate,
      coupon,
      currency,
      taxRegion,
      internalCustomerId,
      stripeCustomerId,
      lineItemsExtra,
      metadataExtra,
      subtotalExtra,
      depositAdjustment,
      shipping,
      billing_details,
      cart,
    });

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        ui_mode: "custom",
        return_url: returnUrl,
        ...(orderId || cartId ? { client_reference_id: orderId || cartId } : {}),
        ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
        line_items,
        payment_intent_data: paymentIntentData,
        metadata,
      },
      clientIp
        ? ({
            headers: { "Stripe-Client-IP": clientIp },
            idempotencyKey,
          } as Stripe.RequestOptions)
        : ({
            idempotencyKey,
          } as Stripe.RequestOptions),
    );

    const clientSecret =
      typeof session.client_secret === "string" ? session.client_secret : null;
    if (!clientSecret) {
      throw new Error("Stripe Checkout Session client_secret is missing"); // i18n-exempt -- internal validation error surfaced to logs/alerts
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    const sessionOrderId =
      typeof session.metadata?.order_id === "string" && session.metadata.order_id
        ? session.metadata.order_id
        : undefined;

    recordMetric("cart_checkout_requests_total", {
      shopId,
      service: "platform-core",
      status: "success",
    });

    const amount = subtotal + depositTotal + taxAmount;
    return {
      clientSecret,
      sessionId: session.id,
      amount,
      currency,
      paymentIntentId,
      orderId: sessionOrderId ?? orderId,
    };
  } catch (err) {
    incrementOperationalError(shopId);
    recordMetric("cart_checkout_requests_total", {
      shopId,
      service: "platform-core",
      status: "failure",
    });
    throw err;
  }
}

export type { CartState };
