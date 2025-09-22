// apps/cms/src/app/cms/settings/page.tsx

import Link from "next/link";
import SettingsShopChooser from "./SettingsShopChooser.client";
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
    <div className="space-y-8 text-foreground">
      <Card className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <CardContent className="relative grid gap-8 p-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <Tag variant="default">
                Settings · Control hubs
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Govern storefront policies with confidence
              </h1>
              <p className="text-sm text-hero-foreground/80">
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
                className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
              >
                <Link href="#shop-selection">Browse existing shops</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featureHighlights.map(({ title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/10 bg-surface-2 p-4 text-sm text-foreground shadow-elevation-1"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div id="shop-selection" className="scroll-mt-32">
        <SettingsShopChooser shops={shops} />
      </div>
    </div>
  );
}
