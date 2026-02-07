import { createHash } from "crypto";
import type Stripe from "stripe";

import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";

import { trackEvent } from "../analytics";
import { type CartState,migrateCartState } from "../cart";
import { findCoupon } from "../coupons";
import { incrementOperationalError } from "../shops/health";
import { getTaxRate } from "../tax";
import { recordMetric } from "../utils";

import {
  buildLineItemsForItem,
  buildSaleLineItemsForItem,
} from "./lineItems";
import { buildCheckoutMetadata } from "./metadata";
import { CheckoutValidationError, repriceCart } from "./reprice";
import { computeSaleTotals, computeTotals } from "./totals";

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

type RepriceDriftPolicy = "enforce_and_proceed" | "enforce_and_reject" | "log_only";

const DEFAULT_REPRICE_POLICY: RepriceDriftPolicy = "enforce_and_proceed";
const DEFAULT_REPRICE_DRIFT_ABS = 0.1; // 10 cents
const DEFAULT_REPRICE_DRIFT_PCT = 0.01; // 1%

function getRepriceDriftPolicy(): RepriceDriftPolicy {
  const raw = (process.env.CHECKOUT_REPRICE_POLICY ?? "").trim().toLowerCase();
  if (raw === "enforce_and_reject") return "enforce_and_reject";
  if (raw === "log_only") return "log_only";
  if (raw === "enforce_and_proceed") return "enforce_and_proceed";
  return DEFAULT_REPRICE_POLICY;
}

function getRepriceDriftAbsThreshold(): number {
  const raw = Number(process.env.CHECKOUT_REPRICE_DRIFT_ABS ?? "");
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_REPRICE_DRIFT_ABS;
  return raw;
}

function getRepriceDriftPctThreshold(): number {
  const raw = Number(process.env.CHECKOUT_REPRICE_DRIFT_PCT ?? "");
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_REPRICE_DRIFT_PCT;
  return raw;
}

function getTaxAmount(subtotal: number, taxRate: number): { cents: number; amount: number } {
  const cents = Math.round(subtotal * taxRate * 100);
  return { cents, amount: cents / 100 };
}

async function repriceHydratedCart(cart: CartState, shopId: string): Promise<CartState> {
  const secureCart = migrateCartState(cart);
  const repriced = await repriceCart(secureCart, shopId, { validateStock: false });
  const skuById = new Map(repriced.map((item) => [item.skuId, item.sku]));

  const updated: CartState = {};
  for (const [key, line] of Object.entries(cart)) {
    const freshSku = skuById.get(line.sku.id);
    updated[key] = { ...line, sku: freshSku ?? line.sku };
  }
  return updated;
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
  priceChanged: boolean;
}> {
  try {
    const driftPolicy = getRepriceDriftPolicy();
    const repricedCart = await repriceHydratedCart(cart, shopId);
    if (!skipInventoryValidation) {
      assertInventoryAvailable(repricedCart);
    }
    const couponDef = await findCoupon(shopId, coupon);
    if (couponDef) {
      await trackEvent(shopId, {
        type: "discount_redeemed",
        code: couponDef.code,
      });
    }

    const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
    const taxRate = await getTaxRate(taxRegion);

    let rentalDays = 0;
    let effectiveReturnDate: string | undefined = returnDate;

    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotal = 0;
    let depositTotal = 0;
    let discount = 0;
    let priceChanged = false;

    let originalAmount = 0;
    let repricedAmount = 0;
    let repricedTax = { cents: 0, amount: 0 };

    if (mode === "sale") {
      const originalTotals = await computeSaleTotals(cart, discountRate, currency);
      const repricedTotals = await computeSaleTotals(repricedCart, discountRate, currency);

      const lineItemsNested = await Promise.all(
        Object.values(repricedCart).map((item) =>
          buildSaleLineItemsForItem(item, discountRate, currency),
        ),
      );
      line_items = lineItemsNested.flat();
      if (lineItemsExtra.length) line_items = line_items.concat(lineItemsExtra);

      subtotal = repricedTotals.subtotal + subtotalExtra;
      depositTotal = 0;
      discount = repricedTotals.discount;
      rentalDays = 0;
      effectiveReturnDate = undefined;

      const originalSubtotal = originalTotals.subtotal + subtotalExtra;
      const originalTax = getTaxAmount(originalSubtotal, taxRate);
      repricedTax = getTaxAmount(subtotal, taxRate);
      originalAmount = originalSubtotal + originalTax.amount;
      repricedAmount = subtotal + repricedTax.amount;
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
        Object.values(repricedCart).map((item) =>
          buildLineItemsForItem(item, rentalDays, discountRate, currency),
        ),
      );
      line_items = lineItemsNested.flat();
      if (lineItemsExtra.length) line_items = line_items.concat(lineItemsExtra);

      const originalTotals = await computeTotals(cart, rentalDays, discountRate, currency);
      const repricedTotals = await computeTotals(repricedCart, rentalDays, discountRate, currency);

      subtotal = repricedTotals.subtotal + subtotalExtra;
      depositTotal = repricedTotals.depositTotal + depositAdjustment;
      discount = repricedTotals.discount;

      const originalSubtotal = originalTotals.subtotal + subtotalExtra;
      const originalDepositTotal = originalTotals.depositTotal + depositAdjustment;
      const originalTax = getTaxAmount(originalSubtotal, taxRate);
      repricedTax = getTaxAmount(subtotal, taxRate);

      originalAmount = originalSubtotal + originalDepositTotal + originalTax.amount;
      repricedAmount = subtotal + depositTotal + repricedTax.amount;
    }

    const diff = repricedAmount - originalAmount;
    const threshold = Math.max(
      getRepriceDriftAbsThreshold(),
      getRepriceDriftPctThreshold() * Math.max(0, repricedAmount),
    );
    if (Math.abs(diff) >= threshold) {
      priceChanged = true;
      recordMetric("cart_reprice_drift_total", {
        shopId,
        service: "platform-core",
        mode,
        policy: driftPolicy,
        direction: diff > 0 ? "up" : "down",
      });

      if (driftPolicy === "enforce_and_reject") {
        throw new CheckoutValidationError(
          "PRICE_CHANGED",
          {
            originalAmount,
            repricedAmount,
            diff,
            threshold,
            currency,
          },
          "Price changed",
        );
      }
    }

    if (repricedTax.cents > 0) {
      line_items.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: repricedTax.cents,
          product_data: { name: "Tax" }, // i18n-exempt -- Stripe product label, not user copy
        },
        quantity: 1,
      });
    }

    const sizesMeta = JSON.stringify(
      Object.fromEntries(
        Object.values(repricedCart).map((item) => [item.sku.id, item.size ?? ""]),
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
      taxAmount: repricedTax.amount,
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
      cart: repricedCart,
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

    return {
      clientSecret,
      sessionId: session.id,
      amount: repricedAmount,
      currency,
      paymentIntentId,
      orderId: sessionOrderId ?? orderId,
      priceChanged,
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
