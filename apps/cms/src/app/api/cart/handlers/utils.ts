import { type NextRequest,NextResponse } from "next/server";

import type { CartState } from "@acme/platform-core/cart";
import {
  asSetCookieHeader,
  CART_COOKIE,
  decodeCartCookie,
  encodeCartCookie,
} from "@acme/platform-core/cartCookie";
import { createCartStore } from "@acme/platform-core/cartStore";

export type CartStore = ReturnType<typeof createCartStore>;
let _store: CartStore | null = null;
export const ensureCartStore = (): CartStore => {
  if (_store) return _store;
  _store = createCartStore();
  return _store;
};

export const getDecodedCartId = (req: NextRequest): string | null => {
  const raw = req.cookies.get(CART_COOKIE)?.value ?? null;
  if (!raw) return null;
  try {
    const decoded = decodeCartCookie(raw);
    return typeof decoded === "string" && decoded ? decoded : null;
  } catch {
    return null;
  }
};

export const withCartCookie = (cartId: string, cart: CartState) => {
  const res = NextResponse.json({ ok: true, cart });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
};

export const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export const serverError = (label: string, err: unknown) => {
  // Log full error server-side for debugging
  console.error(`[api/cart:${label}] error`, err);
  // Return generic error to client to prevent information disclosure
  return NextResponse.json(
    { ok: false, error: "An unexpected error occurred" }, // i18n-exempt -- generic server error
    { status: 500 },
  );
};
