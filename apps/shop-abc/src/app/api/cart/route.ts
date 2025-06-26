// apps/shop-abc/src/app/api/cart/route.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "@/lib/cartCookie";
import { skuSchema } from "@types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const postSchema = z.object({
  sku: skuSchema,
  qty: z.number().int().positive().optional(),
});

const patchSchema = z.object({
  id: z.string(),
  qty: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = postSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { sku, qty = 1 } = parsed.data;
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const line = cart[sku.id];

  cart[sku.id] = { sku, qty: (line?.qty ?? 0) + qty };

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
  return res;
}

export async function PATCH(req: NextRequest) {
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { id, qty } = parsed.data;
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const line = cart[id];

  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  cart[id] = { ...line, qty };

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
  return res;
}
