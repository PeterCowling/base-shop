// apps/shop-abc/src/app/api/cart/route.ts
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
  type CartState,
} from "@platform-core/src/cartCookie";
import { createCart, getCart, setCart } from "@platform-core/src/cartStore";
import { getProductById } from "@/lib/products";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema } from "@platform-core/schemas/cart";
import { z } from "zod";

export const runtime = "edge";

const deleteSchema = z.object({ id: z.string() }).strict();

async function loadCart(
  req: NextRequest,
  create: boolean
): Promise<{ cartId: string | null; cart: CartState }> {
  const raw = req.cookies.get(CART_COOKIE)?.value;
  let cartId = decodeCartCookie(raw);

  if (cartId) {
    return { cartId, cart: await getCart(cartId) };
  }

  if (raw) {
    let parsed: CartState | null = null;
    try {
      parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as CartState;
    } catch {
      try {
        parsed = JSON.parse(raw) as CartState;
      } catch {
        /* ignore */
      }
    }
    if (parsed) {
      cartId = await createCart();
      await setCart(cartId, parsed);
      return { cartId, cart: parsed };
    }
  }

  if (!create) {
    return { cartId: null, cart: {} };
  }

  cartId = await createCart();
  return { cartId, cart: await getCart(cartId) };
}

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

  const { cartId, cart } = await loadCart(req, true);
  const line = cart[sku.id];
  cart[sku.id] = { sku, qty: (line?.qty ?? 0) + qty };
  await setCart(cartId!, cart);

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId!)));
  return res;
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id, qty } = parsed.data;
  const { cartId, cart } = await loadCart(req, false);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  const line = cart[id];
  if (!line) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  if (qty === 0) {
    delete cart[id];
  } else {
    cart[id] = { ...line, qty };
  }
  await setCart(cartId, cart);

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { id } = parsed.data;
  const { cartId, cart } = await loadCart(req, false);
  if (!cartId) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
  if (!cart[id]) {
    return NextResponse.json({ error: "Item not in cart" }, { status: 404 });
  }

  delete cart[id];
  await setCart(cartId, cart);

  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}

export async function GET(req: NextRequest) {
  const { cartId, cart } = await loadCart(req, true);
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId!)));
  return res;
}
