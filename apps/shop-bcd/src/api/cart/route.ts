// apps/shop-abc/src/app/api/cart/route.ts

import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "@/lib/cartCookie";
import { getProductById } from "@/lib/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();
const putSchema = z.record(
  z.object({
    sku: z.object({ id: z.string() }),
    qty: z.number().int().min(1),
    size: z.string().optional(),
  })
);

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
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (sku.sizes.length && !size) {
    return NextResponse.json({ error: "Size required" }, { status: 400 });
  }
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const id = size ? `${sku.id}:${size}` : sku.id;
  const line = cart[id];

  cart[id] = { sku, size, qty: (line?.qty ?? 0) + qty };

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
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
  const cart = decodeCartCookie(cookie);
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
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
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
  const cart = decodeCartCookie(cookie);

  if (!cart[id]) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  delete cart[id];

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
  return res;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  return NextResponse.json({ ok: true, cart });
}

export async function PUT(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const cart: Record<string, { sku: any; qty: number; size?: string }> = {};
  for (const line of Object.values(parsed.data)) {
    const sku = getProductById(line.sku.id);
    if (!sku) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (sku.sizes.length && !line.size) {
      return NextResponse.json({ error: "Size required" }, { status: 400 });
    }
    const id = line.size ? `${sku.id}:${line.size}` : sku.id;
    cart[id] = { sku, size: line.size, qty: line.qty };
  }
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cart)));
  return res;
}
