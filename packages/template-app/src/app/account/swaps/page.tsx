// packages/template-app/src/app/account/swaps/page.tsx
import {
  CART_COOKIE,
  decodeCartCookie,
} from "@platform-core/src/cartCookie";
import {
  getCart,
  removeItem,
  incrementQty,
} from "@platform-core/src/cartStore";
import { getProductById } from "@platform-core/src/products";
import { cookies } from "next/headers";

export default async function SwapPage() {
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? await getCart(cartId) : {};

  async function swap(formData: FormData) {
    "use server";
    const oldSku = formData.get("old") as string;
    const newSku = formData.get("new") as string;
    const cookieStore = await cookies();
    const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
    if (!cartId) return;
    const sku = getProductById(newSku);
    if (!sku) return;
    await removeItem(cartId, oldSku);
    await incrementQty(cartId, sku, 1);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Swap Items</h1>
      {Object.entries(cart).map(([id, line]) => (
        <form key={id} action={swap} className="mb-3 flex gap-2">
          <span className="flex-1">{line.sku.name}</span>
          <input type="hidden" name="old" value={id} />
          <input
            type="text"
            name="new"
            placeholder="New SKU ID"
            className="w-40 border p-1"
          />
          <button
            type="submit"
            className="rounded bg-black px-2 py-1 text-white"
          >
            Swap
          </button>
        </form>
      ))}
    </div>
  );
}
