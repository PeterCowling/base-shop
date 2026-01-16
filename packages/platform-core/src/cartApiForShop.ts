import "server-only";

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
import { getShopSkuById } from "./repositories/catalogSkus.server";
import type { Locale, SKU } from "@acme/types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postSchema, patchSchema, putSchema } from "./schemas/cart";
import { z } from "zod";

const deleteSchema = z.object({ id: z.string() }).strict();

export function createShopCartApi({
  shop,
  locale = "en",
  includeDraft = false,
}: {
  shop: string;
  locale?: Locale;
  includeDraft?: boolean;
}) {
  async function resolveSku(skuId: string): Promise<SKU | null> {
    return await getShopSkuById(shop, skuId, locale, { includeDraft });
  }

  /* ------------------------------------------------------------------
   * PUT – replace cart with provided lines
   * ------------------------------------------------------------------ */
  async function PUT(req: NextRequest) {
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
        return NextResponse.json({ error: "Cart not found" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
      }
    } else {
      cartId = await createCart();
    }

    const cart: CartState = {};
    for (const line of parsed.data.lines) {
      const sku = await resolveSku(line.sku.id);
      if (!sku) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
      }
      if (sku.sizes.length && !line.size) {
        return NextResponse.json({ error: "Size required" }, { status: 400 }); // i18n-exempt -- CORE-2421 internal API string
      }
      if (line.qty > sku.stock) {
        const error = sku.stock <= 0 ? "Out of stock" : "Insufficient stock"; // i18n-exempt -- CORE-2421 internal API string
        return NextResponse.json({ error }, { status: 409 });
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
  async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error.flatten().fieldErrors, {
        status: 400,
      });
    }

    const data: z.infer<typeof postSchema> = parsed.data;
    const {
      sku: { id: skuId },
      qty,
      size,
      rental,
    } = data;

    const sku = await resolveSku(skuId);
    if (!sku) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
    }

    if (sku.sizes.length && !size) {
      return NextResponse.json({ error: "Size required" }, { status: 400 }); // i18n-exempt -- CORE-2421 internal API string
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
      const error = sku.stock <= 0 ? "Out of stock" : "Insufficient stock"; // i18n-exempt -- CORE-2421 internal API string
      return NextResponse.json({ error }, { status: 409 });
    }

    const normalizedRental =
      typeof rental === "undefined"
        ? undefined
        : { ...rental, sku: rental.sku ?? skuId };

    const updated = await (typeof normalizedRental === "undefined"
      ? incrementQty(cartId, sku, qty, size)
      : incrementQty(cartId, sku, qty, size, normalizedRental));

    const res = NextResponse.json({ ok: true, cart: updated });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  }

  /* ------------------------------------------------------------------
   * PATCH – update quantity of an existing item
   * ------------------------------------------------------------------ */
  async function PATCH(req: NextRequest) {
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
      return NextResponse.json({ error: "Cart not found" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
    }

    const cart = await setQty(cartId, id, qty);
    if (!cart) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
    }

    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  }

  /* ------------------------------------------------------------------
   * DELETE – remove an item from the cart
   * ------------------------------------------------------------------ */
  async function DELETE(req: NextRequest) {
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
      return NextResponse.json({ error: "Cart not found" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
    }

    const cart = await removeItem(cartId, id);
    if (!cart) {
      return NextResponse.json({ error: "Item not in cart" }, { status: 404 }); // i18n-exempt -- CORE-2421 internal API string
    }

    const res = NextResponse.json({ ok: true, cart });
    res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
    return res;
  }

  /* ------------------------------------------------------------------
   * GET – fetch the current cart
   * ------------------------------------------------------------------ */
  async function GET(req: NextRequest) {
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

  return { PUT, POST, PATCH, DELETE, GET };
}

