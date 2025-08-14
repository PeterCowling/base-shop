// packages/template-app/src/app/[lang]/subscribe/page.tsx
import { Locale, resolveLocale } from "@/i18n/locales";
import { readShop } from "@platform-core/src/repositories/shops.server";
import { addOrder } from "@platform-core/src/repositories/rentalOrders.server";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ lang?: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang: Locale = resolveLocale(rawLang);
  const shop = await readShop("shop");
  if (!shop.subscriptionsEnabled || shop.type !== "rental") {
    return <p className="p-6">Subscriptions are not enabled.</p>;
  }

  async function selectPlan(formData: FormData) {
    "use server";
    const planId = formData.get("plan") as string;
    if (!planId) return;
    await addOrder("shop", `sub-${planId}-${Date.now()}`, 0);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Choose a Plan</h1>
      <form action={selectPlan} className="flex flex-col gap-4">
        {shop.rentalSubscriptions.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <input type="radio" name="plan" value={p.id} />
            <span>
              {p.id} – {p.itemsIncluded} items, {p.swapLimit} swaps, {p.shipmentsPerMonth}
              {" "}shipments
            </span>
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
