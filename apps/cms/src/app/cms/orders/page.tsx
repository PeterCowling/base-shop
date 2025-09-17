// apps/cms/src/app/cms/orders/page.tsx

import ShopChooser from "@acme/ui/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function OrdersIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Orders · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Stay ahead of order flows across storefronts
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to review rentals, returns, and risk signals before they escalate.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Orders · Control centers"
        heading="Order control centers"
        subheading="Monitor fulfilment, returns, and risk in context for each storefront."
        shops={shops}
        card={{
          icon: "🚚",
          title: (shop) => shop.toUpperCase(),
          description: (shop) =>
            `Track fulfilment, returns, and alerts tailored to ${shop}.`,
          ctaLabel: () => "View orders",
          href: (shop) => `/cms/orders/${shop}`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "orders", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "Create your first shop",
          description:
            "Create a storefront to begin monitoring rentals, returns, and fulfilment alerts.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "orders" },
        }}
      />
    </div>
  );
}
