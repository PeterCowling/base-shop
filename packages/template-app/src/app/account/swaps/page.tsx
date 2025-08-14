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
import { getCustomerSession } from "@auth";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { notFound } from "next/navigation";
import {
  getUserPlan,
  getRemainingSwaps,
  incrementSwapCount,
} from "@platform-core/src/repositories/subscriptionUsage.server";
import { nowIso } from "@acme/date-utils";

export default async function SwapPage() {
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cart = cartId ? await getCart(cartId) : {};
  const session = await getCustomerSession();
  const shop = await readShop("shop");
  if (!shop.subscriptionsEnabled) return notFound();
  const planId = session?.customerId
    ? await getUserPlan("shop", session.customerId)
    : undefined;
  const plan = planId
    ? shop.rentalSubscriptions.find((p) => p.id === planId)
    : undefined;
  const month = nowIso().slice(0, 7);
  const remainingSwaps =
    session?.customerId && plan
      ? await getRemainingSwaps("shop", session.customerId, month, plan.swapLimit)
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
    const shop = await readShop("shop");
    if (!shop.subscriptionsEnabled) return;
    const planId = await getUserPlan("shop", session.customerId);
    const plan = planId
      ? shop.rentalSubscriptions.find((p) => p.id === planId)
      : undefined;
    const month = nowIso().slice(0, 7);
    if (!plan) return;
    const remaining = await getRemainingSwaps(
      "shop",
      session.customerId,
      month,
      plan.swapLimit,
    );
    if (remaining <= 0) return;
    const sku = getProductById(newSku);
    if (!sku) return;
    await removeItem(cartId, oldSku);
    await incrementQty(cartId, sku, 1);
    await incrementSwapCount("shop", session.customerId, month);
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
