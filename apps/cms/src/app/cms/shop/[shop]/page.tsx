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
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-slate-900 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Experience overview
            </p>
            <h1 className="text-3xl font-bold lg:text-4xl">{shop} shop control center</h1>
            <p className="text-white/80">
              Welcome back! Monitor your experience health, preview upgrades, and publish changes
              with confidence. Use the quick actions below to jump back into your most common
              workflows.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-white text-slate-900 hover:bg-white/90">
                <Link href={`/cms/shop/${shop}/pages`}>Manage pages</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={`/cms/shop/${shop}/themes`}>Open theme editor</Link>
              </Button>
            </div>
          </div>
          <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3">
            {metrics.map((metric) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                className="bg-white/10 backdrop-blur [&_span:first-child]:text-white/70 [&_span:last-child]:text-white"
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <UpgradeButton shop={shop} />
        <RollbackCard shop={shop} />
      </div>
    </div>
  );
}
