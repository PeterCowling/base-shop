import { NextResponse, type NextRequest } from "next/server";
import { patchSchema } from "@platform-core/schemas/cart";
import {
  ensureCartStore,
  getDecodedCartId,
  withCartCookie,
  errorResponse,
  serverError,
  type CartStore,
} from "./utils";

export async function PATCH(
  req: NextRequest,
  store: CartStore = ensureCartStore(),
) {
  try {
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
      return errorResponse("Cart not found", 404);
    }

    const cart = await store.setQty(cartId, id, qty);
    if (!cart) {
      return errorResponse("Item not in cart", 404);
    }

    return withCartCookie(cartId, cart);
  } catch (err) {
    return serverError("PATCH", err);
  }
}
