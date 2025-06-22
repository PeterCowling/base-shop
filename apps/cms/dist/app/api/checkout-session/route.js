/* eslint-disable @typescript-eslint/consistent-type-imports */
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { stripe } from "@/lib/stripeServer";
import { NextResponse } from "next/server";
export const runtime = "edge";
export async function POST(req) {
    // 1. read the cookie sent by the browser
    const cookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookie);
    if (!Object.keys(cart).length) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    // 2. Build Stripe line items
    const line_items = Object.values(cart).map((l) => ({
        price_data: {
            currency: "eur",
            unit_amount: l.sku.price * 100,
            product_data: { name: l.sku.title },
        },
        quantity: l.qty,
    }));
    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        success_url: `${req.nextUrl.origin}/success`,
        cancel_url: `${req.nextUrl.origin}/cancelled`,
    });
    return NextResponse.json({ id: session.id });
}
