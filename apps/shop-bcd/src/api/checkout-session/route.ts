// apps/shop-bcd/src/app/api/checkout-session/route.ts
import "@acme/zod-utils/initZod";

import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@/lib/cartCookie";
import { getCustomerSession } from "@auth";
import { createCheckoutSession } from "@platform-core/checkout/session";
import shop from "../../../shop.json";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";

export const runtime = "edge";

const schema = z
  .object({
    returnDate: z.string().optional(),
    coupon: z.string().optional(),
    currency: z.string().optional(),
    taxRegion: z.string().optional(),
    customer: z.string().optional(),
    shipping: shippingSchema.optional(),
    billing_details: billingSchema.optional(),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cookieValue = decodeCartCookie(rawCookie);
  let cart: CartState = {};
  if (cookieValue) {
    try {
      cart = JSON.parse(cookieValue) as CartState;
    } catch {
      cart = {};
    }
  }

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
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
    customer: customerId,
    shipping,
    billing_details,
  } = parsed.data as {
    returnDate?: string;
    coupon?: string;
    currency?: string;
    taxRegion?: string;
    customer?: string;
    shipping?: z.infer<typeof shippingSchema>;
    billing_details?: z.infer<typeof billingSchema>;
  };

  const customerSession = await getCustomerSession();
  const customer = customerId ?? customerSession?.customerId;
  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";

  try {
    const result = await createCheckoutSession(cart, {
      returnDate,
      coupon,
      currency,
      taxRegion,
      customerId: customer,
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
