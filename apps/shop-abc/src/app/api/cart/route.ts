// apps/shop-abc/src/app/api/cart/route.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  createCartId,
  decodeCartCookie,
  encodeCartCookie,
} from "@/lib/cartCookie";
import { getCart, setCart } from "@/lib/cartStore";
import { getProductById } from "@/lib/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = postSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { sku, qty } = parsed.data;
  const skuObj = "title" in sku ? sku : getProductById(sku.id);
  if (!skuObj) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  let id = decodeCartCookie(cookie);
  let isNew = false;
  if (!id) {
    id = createCartId();
    isNew = true;
  }
  const cart = getCart(id);
  const line = cart[skuObj.id];
  cart[skuObj.id] = { sku: skuObj, qty: (line?.qty ?? 0) + qty };
  setCart(id, cart);

  const res = NextResponse.json({ ok: true, cart });
  if (isNew) {
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(id)));
  }
  return res;
}

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id, qty } = parsed.data;
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(cookie);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = getCart(cartId);
  const line = cart[id];

  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (qty === 0) {
    delete cart[id];
  } else {
    cart[id] = { ...line, qty };
  }

  setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

export async function DELETE(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id } = parsed.data;
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(cookie);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = getCart(cartId);

  if (!cart[id]) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  delete cart[id];
  setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  let id = decodeCartCookie(cookie);
  let isNew = false;
  if (!id) {
    id = createCartId();
    isNew = true;
    setCart(id, {});
  }
  const cart = getCart(id);
  const res = NextResponse.json({ ok: true, cart });
  if (isNew) {
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(id)));
  }
  return res;
}
