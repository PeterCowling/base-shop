// packages/template-app/src/api/cart/route.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  persistCart,
  cartFromCookie,
} from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { getProductById } from "@platform-core/src/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";

export const runtime = "node";

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

  const { sku: skuInput, qty } = parsed.data;
  const sku = "title" in skuInput ? skuInput : getProductById(skuInput.id);

  if (!sku) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const cookieVal = req.cookies.get(CART_COOKIE)?.value;
  const id = decodeCartCookie(cookieVal);
  const cart = id ? getCart(id) : {};
  const line = cart[sku.id];

  cart[sku.id] = { sku, qty: (line?.qty ?? 0) + qty };

  const { cookie } = persistCart(cart, id);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(cookie));
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

  const { id: itemId, qty } = parsed.data;

  const cookieVal = req.cookies.get(CART_COOKIE)?.value;
  const id = decodeCartCookie(cookieVal);
  const cart = id ? getCart(id) : {};
  const line = cart[itemId];

  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (qty <= 0) {
    delete cart[itemId];
  } else {
    cart[itemId] = { ...line, qty };
  }

  const { cookie } = persistCart(cart, id);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(cookie));
  return res;
}

/* ------------------------------------------------------------------
 * GET – retrieve current cart
 * ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  const cookieVal = req.cookies.get(CART_COOKIE)?.value;
  const cart = cartFromCookie(cookieVal);
  const { cookie } = persistCart(cart, decodeCartCookie(cookieVal) ?? undefined);
  const res = NextResponse.json({ cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(cookie));
  return res;
}
