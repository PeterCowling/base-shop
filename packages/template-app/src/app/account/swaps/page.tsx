// packages/template-app/src/app/account/swaps/page.tsx
import {
  CART_COOKIE,
  decodeCartCookie,
} from "@platform-core/cartCookie";
import {
  getCart,
  removeItem,
  incrementQty,
} from "@platform-core/cartStore";
import { getProductById } from "@platform-core/products";
import { cookies } from "next/headers";
import { getCustomerSession } from "@auth";
import { readShop } from "@platform-core/repositories/shops.server";
import { notFound } from "next/navigation";
import { coreEnv } from "@acme/config/env/core";
import { nowIso } from "@date-utils";
import {
  getUserPlan,
  getRemainingSwaps,
  incrementSwapCount,
} from "@platform-core/repositories/subscriptionUsage.server";

export default async function SwapPage() {
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? await getCart(cartId) : {};
  const session = await getCustomerSession();
  const shopId = coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) return notFound();
  const planId = session?.customerId
    ? await getUserPlan(shopId, session.customerId)
    : undefined;
  const selectedPlan = planId
    ? shop.rentalSubscriptions.find((p) => p.id === planId)
    : undefined;
  const month = nowIso().slice(0, 7);
  const remainingSwaps =
    session?.customerId && selectedPlan
      ? await getRemainingSwaps(
          shopId,
          session.customerId,
          month,
          selectedPlan.swapLimit,
        )
      : 0;
  const canSwap = remainingSwaps > 0;

  async function swap(formData: FormData) {
    "use server";
    const oldSku = formData.get("old") as string;
    const newSku = formData.get("new") as string;
    const cookieStore = await cookies();
    const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
    const session = await getCustomerSession();
    if (!cartId || !session?.customerId) return;
    const shopId = coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
    const shop = await readShop(shopId);
    if (!shop.subscriptionsEnabled) return;
    const planId = await getUserPlan(shopId, session.customerId);
    const selectedPlan = planId
      ? shop.rentalSubscriptions.find((p) => p.id === planId)
      : undefined;
    const month = nowIso().slice(0, 7);
    if (!selectedPlan) return;
    const remaining = await getRemainingSwaps(
      shopId,
      session.customerId,
      month,
      selectedPlan.swapLimit,
    );
    if (remaining <= 0) return;
    const sku = getProductById(newSku);
    if (!sku) return;
    await removeItem(cartId, oldSku);
    await incrementQty(cartId, sku, 1);
    await incrementSwapCount(shopId, session.customerId, month);
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Swap Items</h1>
      <p className="mb-4">Swaps remaining this month: {remainingSwaps}</p>
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
            disabled={!canSwap}
            className="rounded bg-black px-2 py-1 text-white disabled:opacity-50"
          >
            Swap
          </button>
        </form>
      ))}
    </div>
  );
}
