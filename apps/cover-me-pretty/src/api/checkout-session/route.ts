// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/api/checkout-session/route.ts
import "@acme/zod-utils/initZod";

import { CART_COOKIE, decodeCartCookie, type CartState } from "@platform-core/cartCookie";
import { getCart } from "@platform-core/cartStore";
import { getCustomerSession } from "@auth";
import { getCustomerProfile } from "@platform-core/customerProfiles";
import { getOrCreateStripeCustomerId } from "@platform-core/identity";
import {
  createCheckoutSession,
  INSUFFICIENT_STOCK_ERROR,
} from "@platform-core/checkout/session";
import {
  cartToInventoryRequests,
  validateInventoryAvailability,
} from "@platform-core/inventoryValidation";
import { convertCurrency, getPricing } from "@platform-core/pricing";
import shop from "../../../shop.json";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";
import type Stripe from "stripe";
import { addOrder } from "@platform-core/orders/creation";
import { resolveDataRoot } from "@platform-core/dataRoot";
import path from "node:path";
import { promises as fs } from "node:fs";
import { ulid } from "ulid";

export const runtime = "nodejs";

const schema = z
  .object({
    returnDate: z.string().optional(),
    coupon: z.string().optional(),
    currency: z.string().optional(),
    taxRegion: z.string().optional(),
    customer: z.string().optional(),
    shipping: shippingSchema.optional(),
    billing_details: billingSchema.optional(),
    // Optional coverage codes to align with the template app's
    // checkout-session contract. When present and the shop has
    // coverage included, these codes may add a line-item and adjust
    // the deposit, mirroring the template runtime behaviour.
    coverage: z.array(z.string()).optional(),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  let cartId: string | undefined;
  let cart: CartState = {};
  try {
    const decoded = decodeCartCookie(rawCookie);
    cartId = typeof decoded === "string" ? decoded : undefined;
    cart = cartId ? await getCart(cartId) : {};
  } catch {
    cartId = undefined;
    cart = {};
  }

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 }); // i18n-exempt -- ABC-123 machine-readable API error, not user-facing UI [ttl=2025-06-30]
  }

  const parsed = schema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
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
  } = parsed.data as {
    returnDate?: string;
    coupon?: string;
    currency?: string;
    taxRegion?: string;
    customer?: string;
    shipping?: z.infer<typeof shippingSchema>;
    billing_details?: z.infer<typeof billingSchema>;
    coverage?: string[];
  };

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
  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";

  const coverageCodes = Array.isArray(coverage) ? coverage : [];
  const lineItemsExtra: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  let metadataExtra: Record<string, string> = {};
  let subtotalExtra = 0;
  let depositAdjustment = 0;

  if (shop.coverageIncluded && coverageCodes.length) {
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
          product_data: { name: "Coverage" }, // i18n-exempt -- internal line-item label, not user copy
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

  let inventoryCheck: Awaited<
    ReturnType<typeof validateInventoryAvailability>
  >;
  try {
    inventoryCheck = await validateInventoryAvailability(
      shop.id,
      cartToInventoryRequests(cart),
    );
  } catch (err) {
    console.error("Inventory validation failed", err); // i18n-exempt -- ABC-123 developer log [ttl=2025-06-30]
    return NextResponse.json(
      { error: "Inventory backend unavailable" }, // i18n-exempt -- ABC-123 machine-readable API error [ttl=2025-06-30]
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
      mode: "rental",
      returnDate,
      coupon,
      currency,
      taxRegion,
      internalCustomerId,
      stripeCustomerId,
      shipping,
      billing_details,
      returnUrl: `${req.nextUrl.origin}/success`,
      cartId: cartId ?? undefined,
      clientIp,
      shopId: shop.id,
      lineItemsExtra,
      metadataExtra,
      subtotalExtra,
      depositAdjustment,
      orderId,
      skipInventoryValidation: true,
    });
    const resolvedOrderId = result.orderId ?? orderId;

    // Create a platform order id up front (best-effort)
    const sessionRef = result.sessionId ?? ulid();
    try {
      await addOrder({
        orderId: resolvedOrderId,
        shop: shop.id,
        sessionId: sessionRef,
        deposit: result.amount ?? 0,
        expectedReturnDate: returnDate,
        currency,
        cartId: cartId ?? undefined,
        stripePaymentIntentId: result.paymentIntentId,
      });
    } catch {
      // fallback to JSONL persistence
      try {
        const dir = path.join(resolveDataRoot(), shop.id);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3203 path uses validated shop id under resolveDataRoot [ttl=2026-06-30]
        await fs.mkdir(dir, { recursive: true });
        const entry = {
          id: orderId,
          shop: shop.id,
          sessionId: sessionRef,
          amount: result.amount,
          currency,
          createdAt: new Date().toISOString(),
        };
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- SHOP-3203 fallback write stays under resolved data root [ttl=2026-06-30]
        await fs.appendFile(
          path.join(dir, "orders.jsonl"),
          JSON.stringify(entry) + "\n",
          "utf8",
        );
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({ ...result, orderId: resolvedOrderId });
  } catch (err) {
    if (err instanceof Error && /Invalid returnDate/.test(err.message)) {
      return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 }); // i18n-exempt -- ABC-123 machine-readable API error, not user-facing UI [ttl=2025-06-30]
    }
    if (err instanceof Error && err.message === INSUFFICIENT_STOCK_ERROR) {
      return NextResponse.json({ error: INSUFFICIENT_STOCK_ERROR }, { status: 409 }); // i18n-exempt -- ABC-123 machine-readable API error, not user-facing UI [ttl=2025-06-30]
    }
    console.error(
      "Failed to create Stripe checkout session" /* i18n-exempt -- ABC-123 developer log [ttl=2025-06-30] */,
      err,
    );
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 }); // i18n-exempt -- ABC-123 machine-readable API error, not user-facing UI [ttl=2025-06-30]
  }
}
