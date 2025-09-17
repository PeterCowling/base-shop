// apps/cms/src/app/cms/settings/page.tsx

import ShopChooser from "@/components/cms/ShopChooser";
import { Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function SettingsIndexPage() {
  const shops = await listShops();
  return (
    <div className="space-y-8 text-white">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(165,243,252,0.25),_transparent_55%)]" />
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default" className="bg-white/10 text-white/70">
            Settings · Choose a shop
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            Align commerce ops with your policies
          </h1>
          <p className="text-sm text-white/70">
            Select a shop to adjust taxes, payments, teams, and integrations in sync.
          </p>
        </div>
      </section>

      <ShopChooser
        tag="Settings · Configuration hubs"
        heading="Configuration hubs"
        subheading="Update policies, integrations, and access controls tailored to each storefront."
        shops={shops}
        card={{
          icon: "⚙️",
          title: (shop) => shop.toUpperCase(),
          description: (shop) =>
            `Keep ${shop}'s operations, policies, and integrations aligned.`,
          ctaLabel: () => "Open settings",
          href: (shop) => `/cms/shop/${shop}/settings`,
          analyticsEventName: "shopchooser:navigate",
          analyticsPayload: (shop) => ({ area: "settings", shop }),
        }}
        emptyState={{
          tagLabel: "No shops yet",
          title: "Create your first shop",
          description:
            "Create a storefront to configure payments, policies, and integrations for your teams.",
          ctaLabel: "Create shop",
          ctaHref: "/cms/configurator",
          analyticsEventName: "shopchooser:create",
          analyticsPayload: { area: "settings" },
        }}
      />
    </div>
  );
}
