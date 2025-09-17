// apps/cms/src/app/cms/products/page.tsx

import ShopChooser from "@/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function ProductsIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Catalog · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Keep every assortment launch-ready
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to refine product metadata, bundling, and availability before go-live.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Catalog · Product workspaces"
        heading="Catalog workspaces"
        subheading="Manage assortments, pricing, and merchandising flows per storefront."
        shops={shops}
        card={{
          icon: "📦",
          title: (shop) => shop.toUpperCase(),
          description: (shop) =>
            `Plan assortments, pricing, and lifecycle updates for ${shop}.`,
          ctaLabel: () => "Manage products",
          href: (shop) => `/cms/shop/${shop}/products`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "products", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "No shops found.",
          description:
            "Create a storefront to start organising product data, bundles, and pricing tiers.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "products" },
        }}
      />
    </div>
  );
}
