// apps/cms/src/app/cms/themes/page.tsx

import ShopChooser from "@ui/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function ThemesIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Themes · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Tailor the look and feel per shop
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to swap themes, adjust palettes, and preview storefronts before publishing.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Themes · Studios"
        heading="Theme studios"
        subheading="Apply curated experiences, manage theme versions, and schedule releases for each storefront."
        shops={shops}
        card={{
          icon: "🎨",
          title: (shop) => shop.toUpperCase(),
          description: (shop) =>
            `Fine-tune layouts, palettes, and typography for ${shop}.`,
          ctaLabel: () => "Customize theme",
          href: (shop) => `/cms/shop/${shop}/themes`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "themes", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "Create your first shop",
          description:
            "Configure a storefront to unlock theme controls, scheduling, and preview environments.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "themes" },
        }}
      />
    </div>
  );
}
