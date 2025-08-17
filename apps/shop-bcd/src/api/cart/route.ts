// apps/shop-abc/src/app/api/cart/route.ts
import "@acme/zod-utils/initZod";

import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
  type CartState,
} from "@/lib/cartCookie";
import { getProductById, PRODUCTS } from "@/lib/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();

// This simple handler echoes back the posted body and status 200.
// Stripe / KV integration will extend this in Sprint 5.

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const {
    sku: { id: skuId },
    qty,
    size,
  } = parsed.data;
  const sku = getProductById(skuId);
  if (!sku) {
    const exists = PRODUCTS.some((p) => p.id === skuId);
    const status = exists ? 409 : 404;
    const error = exists ? "Out of stock" : "Item not found";
    return NextResponse.json({ error }, { status });
  }
  if (sku.sizes.length && !size) {
    return NextResponse.json({ error: "Size required" }, { status: 400 });
  }
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart: CartState = JSON.parse(decodeCartCookie(cookie) ?? "{}");
  const id = size ? `${sku.id}:${size}` : sku.id;
  const line = cart[id];
  const newQty = (line?.qty ?? 0) + qty;
  if (newQty > sku.stock) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }

  cart[id] = { sku, size, qty: newQty };

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set(
    "Set-Cookie",
    asSetCookieHeader(encodeCartCookie(JSON.stringify(cart)))
  );
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
  const cart: CartState = JSON.parse(decodeCartCookie(cookie) ?? "{}");
  const line = cart[id];

  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (qty === 0) {
    delete cart[id];
  } else {
    cart[id] = { ...line, qty };
  }

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set(
    "Set-Cookie",
    asSetCookieHeader(encodeCartCookie(JSON.stringify(cart)))
  );
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
  const cart: CartState = JSON.parse(decodeCartCookie(cookie) ?? "{}");

  if (!cart[id]) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  delete cart[id];

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set(
    "Set-Cookie",
    asSetCookieHeader(encodeCartCookie(JSON.stringify(cart)))
  );
  return res;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart: CartState = JSON.parse(decodeCartCookie(cookie) ?? "{}");
  return NextResponse.json({ ok: true, cart });
}
