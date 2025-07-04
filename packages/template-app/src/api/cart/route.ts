// packages/template-app/src/api/cart/route.ts

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

// This simple handler echoes back the posted body and status 200.
// Stripe / KV integration will extend this in Sprint 5.

const postSchema = z.object({
  sku: z.union([skuSchema, skuSchema.pick({ id: true })]),
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

  const { sku: skuInput, qty = 1 } = parsed.data;
  const fullSku = "title" in skuInput ? skuInput : getProductById(skuInput.id);
  if (!fullSku) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const line = cart[fullSku.id];

  cart[fullSku.id] = { sku: fullSku, qty: (line?.qty ?? 0) + qty };

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
