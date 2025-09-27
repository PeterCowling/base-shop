// packages/template-app/src/api/checkout-session/route.ts
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@platform-core/cartCookie";
import { getCart } from "@platform-core/cartStore";
import {
  convertCurrency,
  getPricing,
} from "@platform-core/pricing";
import { createCheckoutSession } from "@platform-core/checkout/session";
import { coreEnv } from "@acme/config/env/core";
import { readShop } from "@platform-core/repositories/shops.server";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(rawCookie);
  const cart: CartState =
    typeof cartId === "string" ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
  }

  const {
    returnDate,
    coupon,
    currency = "EUR",
    taxRegion = "",
    customer: customerId,
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

  try {
    const result = await createCheckoutSession(cart, {
      returnDate,
      coupon,
      currency,
      taxRegion,
      customerId,
      shipping,
      billing_details,
      successUrl: `${req.nextUrl.origin}/success`,
      cancelUrl: `${req.nextUrl.origin}/cancelled`,
      clientIp,
      shopId: shop,
      lineItemsExtra,
      metadataExtra,
      subtotalExtra,
      depositAdjustment,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && /Invalid returnDate/.test(err.message)) {
      return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 }); // i18n-exempt -- ABC-123: machine-readable API error
    }
    console.error("Failed to create Stripe checkout session", err); // i18n-exempt -- ABC-123: developer log
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 }); // i18n-exempt -- ABC-123: machine-readable API error
  }
}
