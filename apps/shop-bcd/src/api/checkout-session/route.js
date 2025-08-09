// apps/shop-bcd/src/app/api/checkout-session/route.ts
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { calculateRentalDays } from "@/lib/date";
import { stripe } from "@lib/stripeServer.server";
import { priceForDays } from "@platform-core/pricing";
import { NextResponse } from "next/server";
/* ------------------------------------------------------------------ *
 *  Constants
 * ------------------------------------------------------------------ */
export const runtime = "edge";
/* ------------------------------------------------------------------ *
 *  Helper functions
 * ------------------------------------------------------------------ */
/**
 * Build the rental-fee line-item and the refundable deposit line-item
 * for a single cart entry.
 */
const buildLineItemsFor = async (item, rentalDays) => {
    const baseName = item.size
        ? `${item.sku.title} (${item.size})`
        : item.sku.title;
    return [
        {
            price_data: {
                currency: "eur",
                unit_amount: (await priceForDays(item.sku, rentalDays)) * 100,
                product_data: { name: baseName },
            },
            quantity: item.qty,
        },
        {
            price_data: {
                currency: "eur",
                unit_amount: item.sku.deposit * 100,
                product_data: { name: `${baseName} deposit` },
            },
            quantity: item.qty,
        },
    ];
};
/**
 * Aggregate cart totals for metadata bookkeeping.
 */
const computeTotals = async (cart, rentalDays) => {
    const rentalTotals = await Promise.all(Object.values(cart).map(async (item) => (await priceForDays(item.sku, rentalDays)) * item.qty));
    const subtotal = rentalTotals.reduce((sum, v) => sum + v, 0);
    const depositTotal = Object.values(cart).reduce((sum, item) => sum + item.sku.deposit * item.qty, 0);
    return { subtotal, depositTotal };
};
/* ------------------------------------------------------------------ *
 *  POST handler
 * ------------------------------------------------------------------ */
export async function POST(req) {
    /* 1️⃣  Load and validate cart ------------------------------------------ */
    const rawCookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(rawCookie);
    if (!Object.keys(cart).length) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    /* 2️⃣  Parse request body ---------------------------------------------- */
    const { returnDate } = (await req.json().catch(() => ({})));
    let rentalDays;
    try {
        rentalDays = calculateRentalDays(returnDate);
    }
    catch (_a) {
        return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
    }
    /* 3️⃣  Build Stripe line-items ----------------------------------------- */
    const nestedItems = await Promise.all(Object.values(cart).map((item) => buildLineItemsFor(item, rentalDays)));
    const line_items = nestedItems.flat();
    /* 4️⃣  Compute metadata ------------------------------------------------- */
    const { subtotal, depositTotal } = await computeTotals(cart, rentalDays);
    const sizesMeta = JSON.stringify(Object.fromEntries(Object.values(cart).map((i) => [i.sku.id, i.size ?? ""])));
    /* 5️⃣  Create Stripe Checkout Session ---------------------------------- */
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        success_url: `${req.nextUrl.origin}/success`,
        cancel_url: `${req.nextUrl.origin}/cancelled`,
        payment_intent_data: {
            metadata: {
                subtotal: subtotal.toString(),
                depositTotal: depositTotal.toString(),
                returnDate: returnDate ?? "",
                rentalDays: rentalDays.toString(),
            },
        },
        metadata: {
            subtotal: subtotal.toString(),
            depositTotal: depositTotal.toString(),
            returnDate: returnDate ?? "",
            rentalDays: rentalDays.toString(),
            sizes: sizesMeta,
        },
        expand: ["payment_intent"],
    });
    /* 6️⃣  Return credentials to client ------------------------------------ */
    const clientSecret = typeof session.payment_intent === "string"
        ? undefined
        : session.payment_intent?.client_secret;
    return NextResponse.json({ clientSecret, sessionId: session.id });
}
