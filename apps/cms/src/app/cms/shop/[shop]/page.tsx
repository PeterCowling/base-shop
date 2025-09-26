// apps/cms/src/app/cms/shop/[shop]/page.tsx

import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, StatCard } from "@ui/components/atoms";
import UpgradeButton from "./UpgradeButton";
import RollbackCard from "./RollbackCard";

export const metadata: Metadata = {
  title: "Dashboard · Base-Shop",
};

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const metrics = [
    {
      label: "Live pages",
      value: new Intl.NumberFormat().format(18 + shop.length),
    },
    {
      label: "Pending drafts",
      value: new Intl.NumberFormat().format((shop.length % 5) + 3),
    },
    {
      label: "Last deployment",
      value: "2 hours ago",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl bg-hero-contrast p-8 text-hero-foreground shadow-elevation-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-hero-foreground/80">
              Experience overview
            </p>
            <h1 className="text-3xl font-bold lg:text-4xl">{shop} shop control center</h1>
            <p className="text-hero-foreground/80">
              Welcome back! Monitor your experience health, preview upgrades, and publish changes
              with confidence. Use the quick actions below to jump back into your most common
              workflows.
            </p>
            {/* Quick action buttons removed as requested */}
          </div>
          <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
            {metrics.map((metric) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                className="bg-surface-2 [&_span:first-child]:text-muted-foreground [&_span:last-child]:text-foreground"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quick links to all shop areas that appear in the Shop menu */}
      <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Quick access</h2>
          <span className="text-sm text-muted-foreground">Jump straight into common tasks</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild className="justify-start">
            <Link href={`/cms/shop/${shop}/pages/new/page`}>New page</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/pages/edit/page`}>Pages</Link>
          </Button>
          <Button asChild className="justify-start">
            <Link href={`/cms/shop/${shop}/products/new`}>New product</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/products`}>Products</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/media`}>Media</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/edit-preview`}>Edit preview</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/themes`}>Theme</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/settings/seo`}>SEO settings</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/settings/deposits`}>Deposits</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpgradeButton shop={shop} />
        <RollbackCard shop={shop} />
      </div>
    </div>
  );
}
