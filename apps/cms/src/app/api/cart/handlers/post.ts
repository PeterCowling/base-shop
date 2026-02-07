import { type NextRequest,NextResponse } from "next/server";

import { getProductById, PRODUCTS } from "@acme/platform-core/products";
import { postSchema } from "@acme/platform-core/schemas/cart";

import {
  type CartStore,
  ensureCartStore,
  errorResponse,
  getDecodedCartId,
  serverError,
  withCartCookie,
} from "./utils";

export async function POST(
  req: NextRequest,
  store: CartStore = ensureCartStore(),
) {
  try {
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
      return errorResponse(error, status);
    }

    if ((sku.sizes?.length ?? 0) > 0 && !size) {
      return errorResponse("Size required", 400);
    }

    let cartId = getDecodedCartId(req);
    if (!cartId) cartId = await store.createCart();

    const cart = await store.getCart(cartId);
    const id = size ? `${sku.id}:${size}` : sku.id;
    const line = cart[id];
    const newQty = (line?.qty ?? 0) + qty;
    if (newQty > sku.stock) {
      return errorResponse("Insufficient stock", 409);
    }

    const updated = await store.incrementQty(cartId, sku as any, qty, size);
    return withCartCookie(cartId, updated);
  } catch (err) {
    return serverError("POST", err);
  }
}
