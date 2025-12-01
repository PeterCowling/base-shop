// apps/cms/src/app/cms/shop/[shop]/page.tsx

import { checkShopExists } from "@acme/lib";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, StatCard } from "@ui/components/atoms";
import { Grid as DSGrid } from "@ui/components/atoms/primitives";
import UpgradeButton from "./UpgradeButton";
import RollbackCard from "./RollbackCard";
import { useTranslations as serverUseTranslations } from "@acme/i18n/useTranslations.server";
import { deriveShopHealth } from "../../../lib/shopHealth";
import type { ConfiguratorProgress } from "@acme/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await serverUseTranslations("en");
  return { title: t("cms.dashboard.title", { brand: t("brand.name") }) as string };
}

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const t = await serverUseTranslations("en");
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();

  let healthValue = "Unknown";

  try {
    const res = await fetch(
      `/api/configurator-progress?shopId=${encodeURIComponent(shop)}`,
    );
    if (res.ok) {
      const json = (await res.json()) as ConfiguratorProgress;
      const summary = deriveShopHealth(json);
      if (summary.status === "healthy") {
        healthValue = "Healthy";
      } else if (summary.status === "degraded") {
        healthValue = "Needs attention";
      } else if (summary.status === "broken") {
        healthValue = "Blocked";
      }
    }
  } catch {
    // If health cannot be loaded, fall back to generic copy.
  }

  const metrics = [
    {
      label: "Shop health",
      value: healthValue,
    },
    {
      label: t("cms.shop.dashboard.livePages"),
      value: new Intl.NumberFormat().format(18 + shop.length),
    },
    {
      label: t("cms.shop.dashboard.pendingDrafts"),
      value: new Intl.NumberFormat().format((shop.length % 5) + 3),
    },
    {
      label: t("cms.shop.dashboard.lastDeployment"),
      value: t("cms.shop.dashboard.lastDeploymentValue"),
    },
  ];

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl bg-hero-contrast p-8 text-hero-foreground shadow-elevation-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-hero-foreground/80">{t(
              "cms.shop.dashboard.experienceOverview"
            )}</p>
            <h1 className="text-3xl font-bold lg:text-4xl">{shop} {t("cms.shop.dashboard.controlCenterSuffix")}</h1>
            <p className="text-hero-foreground/80">{t(
              "cms.shop.dashboard.welcomeHelp"
            )}</p>
            {/* Quick action buttons removed as requested */}
          </div>
          <DSGrid cols={1} gap={4} className="w-full sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <StatCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                className="bg-surface-2 [&_span:first-child]:text-muted-foreground [&_span:last-child]:text-foreground"
              />
            ))}
          </DSGrid>
        </div>
      </section>

      {/* Quick links to all shop areas that appear in the Shop menu */}
      <section className="rounded-3xl border border-border/10 bg-surface-2 p-6 shadow-elevation-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">{t("cms.shop.dashboard.quickAccess")}</h2>
          <span className="text-sm text-muted-foreground">{t("cms.shop.dashboard.quickAccessHint")}</span>
        </div>
        <DSGrid cols={1} gap={3} className="sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild className="justify-start">
            <Link href={`/cms/shop/${shop}/pages/new/page`}>{t("nav.newPage")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/pages/edit/page`}>{t("cms.breadcrumb.pages")}</Link>
          </Button>
          <Button asChild className="justify-start">
            <Link href={`/cms/shop/${shop}/products/new`}>{t("cms.products.new")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/products`}>{t("cms.breadcrumb.products")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/media`}>{t("cms.breadcrumb.media")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/edit-preview`}>{t("cms.shop.dashboard.editPreview")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/themes`}>{t("cms.theme.label")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/settings/seo`}>{t("cms.settings.seo")}</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start">
            <Link href={`/cms/shop/${shop}/settings/deposits`}>{t("cms.settings.deposits")}</Link>
          </Button>
        </DSGrid>
      </section>

      <DSGrid cols={1} gap={6} className="lg:grid-cols-2">
        <UpgradeButton shop={shop} />
        <RollbackCard shop={shop} />
      </DSGrid>
    </div>
  );
}
