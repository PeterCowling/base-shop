// apps/cms/src/app/api/cart/route.ts
//
// This route implements the shopping cart API for the CMS.
// It mirrors the logic provided by the shared `@platform-core/cartApi`
// module but opts into the `nodejs` runtime rather than the default
// edge runtime. Running under the node runtime avoids limitations
// around built-in modules (e.g. `crypto`) and supports local development
// without requiring edge compatibility.
//
// The handlers support the following methods:
//   - GET:    Fetch the current cart. Creates a new cart if none exists.
//   - POST:   Add an item to the cart.
//   - PATCH:  Update the quantity of an existing cart line.
//   - PUT:    Replace the entire cart with provided lines.
//   - DELETE: Remove a cart line.
//
// All responses include a signed cookie identifying the cart so that
// subsequent requests can be associated with the same cart. If the
// cookie is missing or invalid, a fresh cart ID is created.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Import type definitions and helpers from the shared platform core.
import type { CartState } from "@platform-core/cart";
import { createCartStore } from "@platform-core/cartStore";
import { getProductById, PRODUCTS } from "@platform-core/products";
import {
  postSchema,
  patchSchema,
  putSchema,
} from "@platform-core/schemas/cart";
import { z } from "zod";
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "@platform-core/cartCookie";

/**
 * Explicitly set the runtime to `nodejs` so that Node built-in modules
 * like `crypto` remain available. Without this override Next.js
 * attempts to compile the route for the edge runtime which prohibits
 * many Node APIs and can lead to compilation hang-ups (see `/api/cart`).
 */
export const runtime = "nodejs";

// Define a schema for DELETE requests. Only an `id` is accepted.
const deleteSchema = z.object({ id: z.string() }).strict();

// Lazily instantiate a cart store. By default this uses an in-memory
// implementation unless a Redis connection is configured via env vars.
const cartStore = createCartStore();

/**
 * Replace the cart with a provided array of lines. Each line must
 * specify the SKU (id), quantity and optionally a size. If the
 * supplied lines include an unknown SKU or omit a required size, a
 * 404/400 response is returned respectively.
 */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }
  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as string | null;
  if (typeof cartId !== "string") {
    cartId = await cartStore.createCart();
  }
  const cart: CartState = {};
  for (const line of parsed.data.lines) {
    const sku = getProductById(line.sku.id);
    if (!sku) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (sku.sizes.length && !line.size) {
      return NextResponse.json({ error: "Size required" }, { status: 400 });
    }
    const key = line.size ? `${sku.id}:${line.size}` : sku.id;
    cart[key] = { sku, size: line.size, qty: line.qty };
  }
  await cartStore.setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/**
 * Add a single item to the cart. Validates the request body with
 * Zod and handles out-of-stock and missing size errors. Returns the
 * updated cart on success. Creates a cart if none exists.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = postSchema.safeParse(body);
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
    // Distinguish between unknown items and out of stock SKUs
    const exists = PRODUCTS.some((p) => p.id === skuId);
    const status = exists ? 409 : 404;
    const error = exists ? "Out of stock" : "Item not found";
    return NextResponse.json({ error }, { status });
  }
  if (sku.sizes.length && !size) {
    return NextResponse.json({ error: "Size required" }, { status: 400 });
  }
    let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as string | null;
  if (typeof cartId !== "string") {
    cartId = await cartStore.createCart();
  }
  const cart = await cartStore.getCart(cartId);
  const id = size ? `${sku.id}:${size}` : sku.id;
  const line = cart[id];
  const newQty = (line?.qty ?? 0) + qty;
  if (newQty > sku.stock) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }
  const updated = await cartStore.incrementQty(cartId, sku, qty, size);
  const res = NextResponse.json({ ok: true, cart: updated });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/**
 * Update the quantity of a given line in the cart. If the line does not
 * exist or the cart is missing, appropriate 404 responses are returned.
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }
  const { id, qty } = parsed.data;
    const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as string | null;
  if (typeof cartId !== "string") {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = await cartStore.setQty(cartId, id, qty);
  if (!cart) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/**
 * Remove an item from the cart. Returns 404 if the cart is missing or
 * the line does not exist. Otherwise returns the updated cart.
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }
  const { id } = parsed.data;
    const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as string | null;
  if (typeof cartId !== "string") {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const cart = await cartStore.removeItem(cartId, id);
  if (!cart) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

/**
 * Fetch the current cart. If no cart exists, create a new one and
 * return an empty object. Always attaches a signed cart cookie to
 * the response.
 */
export async function GET(req?: NextRequest) {
    let cartId = decodeCartCookie(req?.cookies.get(CART_COOKIE)?.value) as string | null;
  if (typeof cartId !== "string") {
    cartId = await cartStore.createCart();
  }
  const cart = await cartStore.getCart(cartId);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}
