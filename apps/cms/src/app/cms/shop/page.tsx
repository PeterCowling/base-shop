// apps/cms/src/app/cms/shop/page.tsx

import ShopChooser from "@ui/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export const metadata = {
  title: "Choose shop · Base-Shop",
};

export default async function ShopIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(196,181,253,0.28),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Operations · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Launch operations from the right storefront
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to review health, automate workflows, and dive into analytics tailored to that storefront.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Operations · Shop overviews"
        heading="Shop overviews"
        subheading="Jump into analytics, configuration, and automation for each storefront."
        shops={shops}
        card={{
          icon: "🏪",
          title: (shop) => shop,
          description: (shop) =>
            `Coordinate configuration, launches, and health checks for ${shop}.`,
          ctaLabel: () => "Open shop overview",
          href: (shop) => `/cms/shop/${shop}`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "shop", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "Create your first shop",
          description:
            "Launch the configurator to set up products, media, and settings for a new storefront.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "shop" },
        }}
      />
    </div>
  );
}
