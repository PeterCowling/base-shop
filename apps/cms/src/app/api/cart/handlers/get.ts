import type { NextRequest } from "next/server";

import {
  type CartStore,
  ensureCartStore,
  getDecodedCartId,
  serverError,
  withCartCookie,
} from "./utils";

export async function GET(
  req: NextRequest,
  store: CartStore = ensureCartStore(),
) {
  try {
    let cartId = getDecodedCartId(req);
    if (!cartId) cartId = await store.createCart();
    const cart = await store.getCart(cartId);
    return withCartCookie(cartId, cart);
  } catch (err) {
    return serverError("GET", err);
  }
}
