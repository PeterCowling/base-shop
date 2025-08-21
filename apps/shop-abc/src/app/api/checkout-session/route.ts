// apps/shop-abc/src/app/api/checkout-session/route.ts
import "@acme/zod-utils/initZod";

import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@platform-core/cartCookie";
import { getCart } from "@platform-core/cartStore";
import { requirePermission } from "@auth";
import { createCheckoutSession } from "../../../services/checkout";
import shop from "../../../../shop.json";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const schema = z
  .object({
    returnDate: z.string().optional(),
    coupon: z.string().optional(),
    currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
    taxRegion: z.enum(["", "EU", "US"]).default(""),
    customer: z.string().optional(),
    shipping: shippingSchema.optional(),
    billing_details: billingSchema.optional(),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(rawCookie);
  const cart: CartState = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  let session;
  try {
    session = await requirePermission("checkout");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await parseJsonBody(req, schema, "1mb");
  if ("response" in parsed) return parsed.response;

  const {
    returnDate,
    coupon,
    currency,
    taxRegion,
    customer: customerId,
    shipping,
    billing_details,
  } = parsed.data;

  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";

  try {
    const result = await createCheckoutSession(cart, {
      returnDate,
      coupon,
      currency,
      taxRegion,
      customerId: customerId ?? session.customerId,
      shipping,
      billing_details,
      successUrl: `${req.nextUrl.origin}/success`,
      cancelUrl: `${req.nextUrl.origin}/cancelled`,
      clientIp,
      shopId: shop.id,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && /Invalid returnDate/.test(err.message)) {
      return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
    }
    console.error("Failed to create Stripe checkout session", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }
}
