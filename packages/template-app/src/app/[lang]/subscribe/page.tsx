// packages/template-app/src/app/[lang]/subscribe/page.tsx
import { resolveLocale } from "@i18n/locales";
import { stripe } from "@acme/stripe";
import type Stripe from "stripe";
import { coreEnv } from "@acme/config/env/core";
import { readShop } from "@platform-core/repositories/shops.server";
import { getCustomerSession } from "@auth";
import { notFound } from "next/navigation";
import {
  setUserPlan,
} from "@platform-core/repositories/subscriptionUsage.server";
import { setStripeSubscriptionId } from "@platform-core/repositories/users";
import type { SubscriptionPlan } from "@acme/types";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang } = await params;
  resolveLocale(lang);
  const shopId =
    ((coreEnv as { NEXT_PUBLIC_SHOP_ID?: string }).NEXT_PUBLIC_SHOP_ID as
      | string
      | undefined) || "shop";
  const shop = await readShop(shopId);
  if (!shop.subscriptionsEnabled) return notFound();

  async function selectPlan(formData: FormData) {
    "use server";
    const planId = formData.get("plan") as string;
    if (!planId) return;
    const session = await getCustomerSession();
    if (!session?.customerId) return;
    const priceId = planId;
    const params: Stripe.SubscriptionCreateParams & { prorate?: boolean } = {
      customer: session.customerId,
      items: [{ price: priceId }],
      prorate: true,
      metadata: { userId: session.customerId, shop: shopId },
    };
    const sub = await stripe.subscriptions.create(params);
    await setStripeSubscriptionId(session.customerId, sub.id, shopId);
    await setUserPlan(shopId, session.customerId, planId);
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">{/** i18n-exempt: server-rendered page heading */}Choose a Plan</h1>
      <form action={selectPlan} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shop.rentalSubscriptions.map((p: SubscriptionPlan) => (
          <label
            key={p.id}
            className="flex cursor-pointer flex-col gap-2 rounded border p-4 hover:border-black"
          >
            {/* eslint-disable-next-line ds/min-tap-size -- UI-1423 label provides the 40px+ tap target; input is visually hidden */}
            <input type="radio" name="plan" value={p.id} className="sr-only" />
            <span className="text-lg font-semibold">{p.id}</span>
            {shop.subscriptionsEnabled && (
              <>
                <span>
                  {/** i18n-exempt: demo copy; values vary per plan */}
                  {p.itemsIncluded} items included
                </span>
                <span>
                  {/** i18n-exempt: demo copy; values vary per plan */}
                  {p.swapLimit} swaps/month
                </span>
                <span>
                  {/** i18n-exempt: demo copy; values vary per plan */}
                  {p.shipmentsPerMonth} shipments/month
                </span>
              </>
            )}
          </label>
        ))}
        <button
          type="submit"
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded bg-black px-4 text-white"
        >
          {/** i18n-exempt: server-rendered action label */}Subscribe
        </button>
      </form>
    </div>
  );
}
