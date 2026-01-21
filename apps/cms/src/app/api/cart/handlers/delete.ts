import { type NextRequest,NextResponse } from "next/server";
import { z } from "zod";

import {
  type CartStore,
  ensureCartStore,
  errorResponse,
  getDecodedCartId,
  serverError,
  withCartCookie,
} from "./utils";

const deleteSchema = z.object({ id: z.string() }).strict();

export async function DELETE(
  req: NextRequest,
  store: CartStore = ensureCartStore(),
) {
  try {
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
      return errorResponse("Cart not found", 404);
    }

    const cart = await store.removeItem(cartId, id);
    if (!cart) {
      return errorResponse("Item not in cart", 404);
    }

    return withCartCookie(cartId, cart);
  } catch (err) {
    return serverError("DELETE", err);
  }
}
