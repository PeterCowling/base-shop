// packages/platform-core/src/cartApi.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "./cartCookie";
import type { CartState } from "./cart";
import {
  createCart,
  getCart,
  setCart,
  incrementQty,
  setQty,
  removeItem,
} from "./cartStore";
import { getProductById, PRODUCTS } from "./products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema, putSchema } from "./schemas/cart";
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

  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as
    | string
    | null;
  if (cartId) {
    const existing = await getCart(cartId);
    if (Object.keys(existing ?? {}).length === 0) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }
  } else {
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
    if (line.qty > sku.stock) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
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
    rental,
  } = parsed.data as any;
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

  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as
    | string
    | null;
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await getCart(cartId);
  const id = size ? `${sku.id}:${size}` : sku.id;
  const line = cart[id];
  const newQty = (line?.qty ?? 0) + qty;
  if (newQty > sku.stock) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 409 });
  }
  // Only pass `rental` when defined to avoid an extra undefined arg
  const updated = await (typeof rental === "undefined"
    ? incrementQty(cartId, sku, qty, size)
    : incrementQty(cartId, sku, qty, size, rental));
  const res = NextResponse.json({ ok: true, cart: updated });
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

  const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as
    | string
    | null;
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

  const cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as
    | string
    | null;
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
  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value) as
    | string
    | null;
  if (!cartId) {
    cartId = await createCart();
  }
  const cart = await getCart(cartId);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}
