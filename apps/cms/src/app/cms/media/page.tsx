// apps/cms/src/app/cms/media/page.tsx

import ShopChooser from "@/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function MediaIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(134,239,172,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Media · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Curate visuals for each storefront
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to organise assets, rights, and variants with confidence.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Media · Libraries"
        heading="Media libraries"
        subheading="Review uploads, tag assets, and maintain brand consistency for every storefront."
        shops={shops}
        card={{
          icon: "🎞️",
          title: (shop) => shop.toUpperCase(),
          description: (shop) =>
            `Organise imagery, video, and rich media powering ${shop}.`,
          ctaLabel: () => "Open media library",
          href: (shop) => `/cms/shop/${shop}/media`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "media", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "Create your first shop",
          description:
            "Set up a storefront to begin curating media collections and asset rights.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "media" },
        }}
      />
    </div>
  );
}
