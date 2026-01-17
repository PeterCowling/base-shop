// packages/template-app/src/api/checkout-session/route.ts
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@acme/platform-core/cartCookie";
import { getCart } from "@acme/platform-core/cartStore";
import {
  convertCurrency,
  getPricing,
} from "@acme/platform-core/pricing";
import {
  createCheckoutSession,
  INSUFFICIENT_STOCK_ERROR,
} from "@acme/platform-core/checkout/session";
import {
  cartToInventoryRequests,
  validateInventoryAvailability,
} from "@acme/platform-core/inventoryValidation";
import { coreEnv } from "@acme/config/env/core";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getCustomerSession } from "@acme/auth";
import { getCustomerProfile } from "@acme/platform-core/customerProfiles";
import { getOrCreateStripeCustomerId } from "@acme/platform-core/identity";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { ulid } from "ulid";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const decodedCartId = decodeCartCookie(rawCookie);
  const cartId = typeof decodedCartId === "string" ? decodedCartId : undefined;
  const cart: CartState = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }

  const {
    returnDate,
    coupon,
    currency = "EUR",
    taxRegion = "",
    customer,
    shipping,
    billing_details,
    coverage,
  } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
    coupon?: string;
    currency?: string;
    taxRegion?: string;
    customer?: string;
    shipping?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.Shipping;
    billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
    coverage?: string[];
  };

  const shop = (coreEnv.NEXT_PUBLIC_DEFAULT_SHOP as string | undefined) || "shop";
  const shopInfo = await readShop(shop);

  const customerSession = await getCustomerSession();
  const internalCustomerId = customerSession?.customerId;
  let stripeCustomerId = customer;
  if (internalCustomerId) {
    const profile = await getCustomerProfile(internalCustomerId).catch(() => null);
    stripeCustomerId = await getOrCreateStripeCustomerId({
      internalCustomerId,
      email: profile?.email,
      name: profile?.name,
    });
  }

  const coverageCodes = Array.isArray(coverage) ? coverage : [];
  const lineItemsExtra: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let metadataExtra: Record<string, string> = {};
  let subtotalExtra = 0;
  let depositAdjustment = 0;

  if (shopInfo.coverageIncluded && coverageCodes.length) {
    const pricing = await getPricing();
    let coverageFee = 0;
    let coverageWaiver = 0;
    for (const code of coverageCodes) {
      const rule = pricing.coverage?.[
        code as keyof NonNullable<typeof pricing.coverage>
      ];
      if (rule) {
        coverageFee += rule.fee;
        coverageWaiver += rule.waiver;
      }
    }
    const feeConv = await convertCurrency(coverageFee, currency);
    const waiveConv = await convertCurrency(coverageWaiver, currency);
    if (feeConv > 0) {
      lineItemsExtra.push({
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: feeConv * 100,
          product_data: { name: "Coverage" }, // i18n-exempt -- ABC-123: product label for internal line-item
        },
        quantity: 1,
      });
      subtotalExtra = feeConv;
    }
    if (waiveConv > 0) {
      depositAdjustment = -waiveConv;
    }
    metadataExtra = {
      coverage: coverageCodes.join(","),
      coverageFee: String(feeConv),
      coverageWaiver: String(waiveConv),
    };
  }

  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";
  const checkoutMode: "rental" | "sale" =
    (shopInfo as { type?: string })?.type === "rental" ? "rental" : "sale";

  let inventoryCheck: Awaited<
    ReturnType<typeof validateInventoryAvailability>
  >;
  try {
    inventoryCheck = await validateInventoryAvailability(
      shop,
      cartToInventoryRequests(cart),
    );
  } catch (err) {
    console.error("Inventory validation failed", err); // i18n-exempt -- ABC-123: developer log
    return NextResponse.json(
      { error: "Inventory backend unavailable" }, // i18n-exempt -- ABC-123: machine-readable API error
      { status: 503 },
    );
  }
  if (!inventoryCheck.ok) {
    return NextResponse.json(
      {
        error: INSUFFICIENT_STOCK_ERROR,
        code: "inventory_insufficient",
        items: inventoryCheck.insufficient,
      },
      { status: 409 },
    );
  }

  try {
    const orderId = ulid();
    const result = await createCheckoutSession(cart, {
      mode: checkoutMode,
      returnDate,
      coupon,
      currency,
      taxRegion,
      internalCustomerId,
      stripeCustomerId,
      shipping,
      billing_details,
      returnUrl: `${req.nextUrl.origin}/success`,
      cartId,
      clientIp,
      shopId: shop,
      lineItemsExtra,
      metadataExtra,
      subtotalExtra,
      depositAdjustment,
      orderId,
      skipInventoryValidation: true,
    });
    return NextResponse.json({ ...result, orderId: result.orderId ?? orderId });
  } catch (err) {
    if (err instanceof Error && /Invalid returnDate/.test(err.message)) {
      return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
    }
    if (err instanceof Error && err.message === INSUFFICIENT_STOCK_ERROR) {
      return NextResponse.json({ error: INSUFFICIENT_STOCK_ERROR }, { status: 409 }); // i18n-exempt -- ABC-123: machine-readable API error
    }
    console.error("Failed to create Stripe checkout session", err); // i18n-exempt -- ABC-123: developer log
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 }); // i18n-exempt -- ABC-123: machine-readable API error
  }
}
