// apps/shop-abc/src/app/api/cart/route.ts
import { asSetCookieHeader, CART_COOKIE, decodeCartCookie, encodeCartCookie, cartLineKey, } from "@/lib/cartCookie";
import { getProductById } from "@/lib/products";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";
export const runtime = "edge";
const deleteSchema = z.object({ id: z.string() }).strict();
export async function POST(req) {
    const json = await req.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
    }
    const { sku, qty = 1, size } = parsed.data;
    const skuObj = "title" in sku ? sku : getProductById(sku.id);
    if (!skuObj) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    const cookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookie);
    const id = cartLineKey(skuObj.id, size);
    const line = cart[id];
    cart[id] = { sku: skuObj, qty: (line?.qty ?? 0) + qty, size };
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
    return res;
}
export async function PATCH(req) {
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
    }
    const { id, qty } = parsed.data;
    const cookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookie);
    const line = cart[id];
    if (!line) {
        return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }
    if (qty === 0) {
        delete cart[id];
    }
    else {
        cart[id] = { ...line, qty };
    }
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
    return res;
}
export async function DELETE(req) {
    const json = await req.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
    }
    const { id } = parsed.data;
    const cookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookie);
    if (!cart[id]) {
        return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }
    delete cart[id];
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
    return res;
}
export async function GET(req) {
    const cookie = req.cookies.get(CART_COOKIE)?.value;
    const cart = decodeCartCookie(cookie);
    return NextResponse.json({ ok: true, cart });
}
