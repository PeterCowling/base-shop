import { NextResponse, type NextRequest } from "next/server";
import { getProductById } from "@platform-core/products";
import { putSchema } from "@platform-core/schemas/cart";
import type { CartState } from "@platform-core/cart";
import {
  ensureCartStore,
  getDecodedCartId,
  withCartCookie,
  errorResponse,
  serverError,
  type CartStore,
} from "./utils";

export async function PUT(
  req: NextRequest,
  store: CartStore = ensureCartStore(),
) {
  try {
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
        return errorResponse("Item not found", 404);
      }
      if ((sku.sizes?.length ?? 0) > 0 && !line.size) {
        return errorResponse("Size required", 400);
      }
      const key = line.size ? `${sku.id}:${line.size}` : sku.id;
      cart[key] = { sku, size: line.size, qty: line.qty };
    }

    await store.setCart(cartId, cart);
    return withCartCookie(cartId, cart);
  } catch (err) {
    return serverError("PUT", err);
  }
}
