// apps/cms/src/app/cms/settings/page.tsx

import Link from "next/link";
import ShopChooser from "@/components/cms/ShopChooser";
import { Button, Card, CardContent, Tag } from "@ui/components/atoms";
import { listShops } from "../../../lib/listShops";

export default async function SettingsIndexPage() {
  const shops = await listShops();
  const featureHighlights = [
    {
      title: "Policy coverage",
      description: "Taxes, payments, and compliance tuned per storefront.",
    },
    {
      title: "Team alignment",
      description: "Manage who can adjust risk, finance, and merchandising levers.",
    },
    {
      title: "Integrations",
      description: "Configure services that keep operations and data in sync.",
    },
  ];
  return (
    <div className="space-y-8 text-white">
      <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.25),_transparent_55%)]" />
        <CardContent className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Tag variant="default" className="bg-white/10 text-white/70">
                Settings · Control hubs
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Govern storefront policies with confidence
              </h1>
              <p className="text-sm text-white/70">
                Choose a shop to orchestrate taxes, payments, compliance, and access so every channel stays aligned.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 px-5 text-sm font-semibold">
                <Link href="/cms/configurator">Create a new shop</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-white/40 text-white hover:bg-white/10"
              >
                <Link href="#shop-selection">Browse existing shops</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {featureHighlights.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div id="shop-selection" className="scroll-mt-32">
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
    </div>
  );
}
