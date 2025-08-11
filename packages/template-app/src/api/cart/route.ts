// packages/template-app/src/api/cart/route.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
  cartKey,
} from "@platform-core/src/cartCookie";
import { createCart, getCart, setCart } from "@platform-core/src/cartStore";
import { getProductById } from "@platform-core/src/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();

/* ------------------------------------------------------------------
 * POST – add an item to the cart
 * ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { sku: skuInput, qty, size } = parsed.data;
  const sku = "title" in skuInput ? skuInput : getProductById(skuInput.id);
  
  if (!sku) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (sku.sizes.length && !size) {
    return NextResponse.json({ error: "Size is required" }, { status: 400 });
  }

  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await getCart(cartId);
  const key = cartKey(sku.id, size);
  const line = cart[key];
  cart[key] = { sku, qty: (line?.qty ?? 0) + qty, size };
  await setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/* ------------------------------------------------------------------
 * PATCH – update quantity of an existing item
 * ------------------------------------------------------------------ */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id, qty } = parsed.data;

  const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = await getCart(cartId);
  const line = cart[id];

  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (qty === 0) {
    delete cart[id];
  } else {
    cart[id] = { ...line, qty };
  }
  await setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/* ------------------------------------------------------------------
 * DELETE – remove an item from the cart
 * ------------------------------------------------------------------ */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id } = parsed.data;

  const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = await getCart(cartId);

  if (!cart[id]) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  delete cart[id];
  await setCart(cartId, cart);

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/* ------------------------------------------------------------------
 * GET – fetch the current cart
 * ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await getCart(cartId);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}
