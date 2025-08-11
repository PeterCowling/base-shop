// packages/platform-core/src/cartApi.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
  type CartState,
} from "@platform-core/src/cartCookie";
import {
  createCart,
  getCart,
  incrementQty,
  setCart,
  setQty,
  removeItem,
} from "@platform-core/src/cartStore";
import { getProductById } from "@platform-core/src/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema, putSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();

/* ------------------------------------------------------------------
 * PUT – replace cart with provided lines
 * ------------------------------------------------------------------ */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = putSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await createCart();
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

  await setCart(cartId, cart);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

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

  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await incrementQty(cartId, sku, qty, size);
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
  const cart = await setQty(cartId, id, qty);
  if (!cart) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }
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
  const cart = await removeItem(cartId, id);
  if (!cart) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }
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

