// packages/template-app/src/app/[lang]/subscribe/page.tsx
import { Locale, resolveLocale } from "@/i18n/locales";
import { stripe } from "@acme/stripe";
import { coreEnv } from "@acme/config/env/core";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { getCustomerSession } from "@auth";
import { notFound } from "next/navigation";
import {
  setUserPlan,
} from "@platform-core/src/repositories/subscriptionUsage.server";
import { setStripeSubscriptionId } from "@platform-core/repositories/users";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const shopId = coreEnv.NEXT_PUBLIC_SHOP_ID || "shop";
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) return notFound();

  async function selectPlan(formData: FormData) {
    "use server";
    const planId = formData.get("plan") as string;
    if (!planId) return;
    const session = await getCustomerSession();
    if (!session?.customerId) return;
    const priceId = planId;
    const sub = await stripe.subscriptions.create({
      customer: session.customerId,
      items: [{ price: priceId }],
      // @ts-ignore - `prorate` is deprecated but required for this flow
      prorate: true,
      metadata: { userId: session.customerId, shop: shopId },
    });
    await setStripeSubscriptionId(session.customerId, sub.id);
    await setUserPlan(shopId, session.customerId, planId);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Choose a Plan</h1>
      <form action={selectPlan} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shop.rentalSubscriptions.map((p) => (
          <label
            key={p.id}
            className="flex cursor-pointer flex-col gap-2 rounded border p-4 hover:border-black"
          >
            <input type="radio" name="plan" value={p.id} className="sr-only" />
            <span className="text-lg font-semibold">{p.id}</span>
            {shop.subscriptionsEnabled && (
              <>
                <span>{p.itemsIncluded} items included</span>
                <span>{p.swapLimit} swaps/month</span>
                <span>{p.shipmentsPerMonth} shipments/month</span>
              </>
            )}
          </label>
        ))}
        <button
          type="submit"
          className="mt-4 rounded bg-black px-4 py-2 text-white"
        >
          Subscribe
        </button>
      </form>
    </div>
  );
}
