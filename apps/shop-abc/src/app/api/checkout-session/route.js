// apps/shop-abc/src/app/api/checkout-session/route.ts
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { calculateRentalDays } from "@/lib/date";
import { stripe } from "@/lib/stripeServer";
import { priceForDays } from "@platform-core/pricing";
import { NextResponse } from "next/server";
/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */
/**
 * Produce the two Stripe line-items (rental + deposit) for a single cart item.
 */
const buildLineItemsForItem = async (item, rentalDays) => {
    const unitPrice = await priceForDays(item.sku, rentalDays);
    const baseName = item.size
        ? `${item.sku.title} (${item.size})`
        : item.sku.title;
    return [
        {
            price_data: {
                currency: "eur",
                unit_amount: unitPrice * 100,
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
 * Aggregate rental and deposit totals for later bookkeeping.
 */
const computeTotals = async (cart, rentalDays) => {
    const subtotals = await Promise.all(Object.values(cart).map(async (item) => (await priceForDays(item.sku, rentalDays)) * item.qty));
    const subtotal = subtotals.reduce((sum, v) => sum + v, 0);
    const depositTotal = Object.values(cart).reduce((sum, item) => sum + item.sku.deposit * item.qty, 0);
    return { subtotal, depositTotal };
};
/* ------------------------------------------------------------------ *
 *  Route handler
 * ------------------------------------------------------------------ */
export const runtime = "edge";
export async function POST(req) {
    /* 1️⃣ Decode cart cookie -------------------------------------------------- */
    const rawCookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(rawCookie);
    if (!Object.keys(cart).length) {
        return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    /* 2️⃣ Parse optional body ------------------------------------------------- */
    const { returnDate } = (await req.json().catch(() => ({})));
    let rentalDays;
    try {
        rentalDays = calculateRentalDays(returnDate);
    }
    catch (_a) {
        return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
    }
    /* 3️⃣ Build Stripe line-items & totals ------------------------------------ */
    const lineItemsNested = await Promise.all(Object.values(cart).map((item) => buildLineItemsForItem(item, rentalDays)));
    const line_items = lineItemsNested.flat();
    const { subtotal, depositTotal } = await computeTotals(cart, rentalDays);
    /* 4️⃣ Serialize sizes for metadata --------------------------------------- */
    const sizesMeta = JSON.stringify(Object.fromEntries(Object.entries(cart).map(([id, item]) => [id, item.size ?? ""])));
    /* 5️⃣ Create Checkout Session -------------------------------------------- */
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
    /* 6️⃣ Return client credentials ------------------------------------------ */
    const clientSecret = typeof session.payment_intent === "string"
        ? undefined
        : session.payment_intent?.client_secret;
    return NextResponse.json({ clientSecret, sessionId: session.id });
}
