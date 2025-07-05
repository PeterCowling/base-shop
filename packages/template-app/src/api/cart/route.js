// packages/template-app/src/api/cart/route.ts
import { asSetCookieHeader, CART_COOKIE, decodeCartCookie, encodeCartCookie, } from "@/lib/cartCookie";
import { getProductById } from "@platform-core/products";
import { skuSchema } from "@types";
import { NextResponse } from "next/server";
import { z } from "zod";
export const runtime = "edge";
/* ------------------------------------------------------------------
 * Zod schemas for request bodies
 * ------------------------------------------------------------------ */
const postSchema = z.object({
    sku: z.union([skuSchema, skuSchema.pick({ id: true })]),
    qty: z.number().int().positive().optional(),
});
const patchSchema = z.object({
    id: z.string(),
    qty: z.number().int().positive(),
});
/* ------------------------------------------------------------------
 * POST – add an item to the cart
 * ------------------------------------------------------------------ */
export async function POST(req) {
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { sku: skuInput, qty = 1 } = parsed.data;
    const sku = "title" in skuInput ? skuInput : getProductById(skuInput.id);
    if (!sku) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const cookieVal = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookieVal);
    const line = cart[sku.id];
    cart[sku.id] = { sku, qty: (line?.qty ?? 0) + qty };
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
    return res;
}
/* ------------------------------------------------------------------
 * PATCH – update quantity of an existing item
 * ------------------------------------------------------------------ */
export async function PATCH(req) {
    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { id, qty } = parsed.data;
    const cookieVal = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookieVal);
    const line = cart[id];
    if (!line) {
        return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }
    cart[id] = { ...line, qty };
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
    return res;
}
