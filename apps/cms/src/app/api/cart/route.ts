// apps/cms/src/app/api/cart/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { CartState } from "@platform-core/cart";
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "@platform-core/cartCookie";
import { createCartStore } from "@platform-core/cartStore";
import { getProductById, PRODUCTS } from "@platform-core/products";
import {
  patchSchema,
  postSchema,
  putSchema,
} from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "nodejs";

/** Safe, memoized store creation so failures happen inside handlers, not at import time. */
type CartStore = ReturnType<typeof createCartStore>;
let _store: CartStore | null = null;
const ensureCartStore = (): CartStore => {
  if (_store) return _store;
  _store = createCartStore();
  return _store;
};

/** Never call decode on falsy/empty cookie values. */
const getDecodedCartId = (req: NextRequest): string | null => {
  const raw = req.cookies.get(CART_COOKIE)?.value ?? null;
  if (!raw) return null;
  // If your decode throws on malformed input, catch and treat as null
  try {
    const decoded = decodeCartCookie(raw);
    return typeof decoded === "string" && decoded ? decoded : null;
  } catch {
    return null;
  }
};

// DELETE /api/cart
const deleteSchema = z.object({ id: z.string() }).strict();

export async function PUT(req: NextRequest) {
  try {
    const store = ensureCartStore();

    const body = await req.json().catch(() => ({}));
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      });
    }

    let cartId = getDecodedCartId(req);
    if (!cartId) cartId = await store.createCart();

    const cart: CartState = {};
    for (const line of parsed.data.lines) {
      const sku = getProductById(line.sku.id);
      if (!sku) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      if ((sku.sizes?.length ?? 0) > 0 && !line.size) {
        return NextResponse.json({ error: "Size required" }, { status: 400 });
      }
      const key = line.size ? `${sku.id}:${line.size}` : sku.id;
      cart[key] = { sku, size: line.size, qty: line.qty };
    }

    await store.setCart(cartId, cart);
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  } catch (err) {
    console.error("[api/cart:PUT] error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = ensureCartStore();

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
      const exists = PRODUCTS.some((p) => p.id === skuId);
      const status = exists ? 409 : 404;
      const error = exists ? "Out of stock" : "Item not found";
      return NextResponse.json({ error }, { status });
    }

    if ((sku.sizes?.length ?? 0) > 0 && !size) {
      return NextResponse.json({ error: "Size required" }, { status: 400 });
    }

    let cartId = getDecodedCartId(req);
    if (!cartId) cartId = await store.createCart();

    const cart = await store.getCart(cartId);
    const id = size ? `${sku.id}:${size}` : sku.id;
    const line = cart[id];
    const newQty = (line?.qty ?? 0) + qty;
    if (newQty > sku.stock) {
      return NextResponse.json(
        { error: "Insufficient stock" },
        { status: 409 }
      );
    }

    const updated = await store.incrementQty(cartId, sku, qty, size);
    const res = NextResponse.json({ ok: true, cart: updated });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  } catch (err) {
    console.error("[api/cart:POST] error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const store = ensureCartStore();

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      });
    }

    const { id, qty } = parsed.data;

    const cartId = getDecodedCartId(req);
    if (!cartId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cart = await store.setQty(cartId, id, qty);
    if (!cart) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  } catch (err) {
    console.error("[api/cart:PATCH] error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const store = ensureCartStore();

    const body = await req.json().catch(() => ({}));
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      });
    }

    const { id } = parsed.data;

    const cartId = getDecodedCartId(req);
    if (!cartId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const cart = await store.removeItem(cartId, id);
    if (!cart) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  } catch (err) {
    console.error("[api/cart:DELETE] error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const store = ensureCartStore();

    let cartId = getDecodedCartId(req);
    if (!cartId) cartId = await store.createCart();

    const cart = await store.getCart(cartId);
    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  } catch (err) {
    console.error("[api/cart:GET] error", err);
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
