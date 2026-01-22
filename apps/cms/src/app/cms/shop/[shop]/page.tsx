// apps/cms/src/app/cms/shop/[shop]/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { useTranslations as serverUseTranslations } from "@acme/i18n/useTranslations.server";
import { checkShopExists } from "@acme/platform-core/shops";
import { deriveOperationalHealth } from "@acme/platform-core/shops/health";
import type { ConfiguratorProgress } from "@acme/types";
import { Button, StatCard } from "@acme/ui/components/atoms";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";
import { CmsBuildHero } from "@acme/ui/components/cms"; // UI: @acme/ui/components/cms/CmsBuildHero

import { deriveShopHealth } from "../../../lib/shopHealth";
import ReRunSmokeButton from "../ReRunSmokeButton.client";

import CreationStatus from "./CreationStatus";
import HealthDetails from "./HealthDetails";
import RollbackCard from "./RollbackCard";
import UpgradeButton from "./UpgradeButton";
import UpgradeState from "./UpgradeState";

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
  let runtimeHealthValue = "Unknown";
  let smokeTestsValue = "Unknown";
  let errorSummaryValue = "None recorded";

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

  try {
    const opSummary = await deriveOperationalHealth(shop);
    if (opSummary.status === "healthy") {
      runtimeHealthValue = "Healthy";
    } else if (opSummary.status === "needs-attention") {
      runtimeHealthValue = "Needs attention";
    } else if (opSummary.status === "broken") {
      runtimeHealthValue = "Broken";
    }

    const testsStatus = opSummary.deploy?.testsStatus;
    const testedAt = opSummary.deploy?.lastTestedAt;
    if (testsStatus === "passed") {
      smokeTestsValue = testedAt
        ? `Passed @ ${new Date(testedAt).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Passed";
    } else if (testsStatus === "failed") {
      smokeTestsValue = testedAt
        ? `Failed @ ${new Date(testedAt).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "Failed";
    } else if (testsStatus === "not-run" || testsStatus === undefined) {
      smokeTestsValue = "Not run";
    }

    if ((opSummary.errorCount ?? 0) > 0) {
      const count = opSummary.errorCount ?? 0;
      const last = opSummary.lastErrorAt
        ? new Date(opSummary.lastErrorAt).toLocaleString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined;
      errorSummaryValue = last
        ? `${count} in last 24h (last @ ${last})`
        : `${count} in last 24h`;
    }
  } catch {
    // If operational health cannot be loaded, leave runtimeHealthValue/smokeTestsValue as Unknown.
  }

  const metrics = [
    {
      label: "Shop health",
      value: healthValue,
    },
    {
      label: "Runtime health",
      value: runtimeHealthValue,
    },
    {
      label: "Smoke tests",
      value: smokeTestsValue,
    },
    {
      label: "Recent errors",
      value: errorSummaryValue,
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
          <div className="min-w-0 lg:flex-1">
            <CmsBuildHero
              tag={String(t("cms.shop.dashboard.experienceOverview"))}
              title={`${shop} ${String(t("cms.shop.dashboard.controlCenterSuffix"))}`}
              body={String(t("cms.shop.dashboard.welcomeHelp"))}
              tone="operate"
            />
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

      <DSGrid cols={1} gap={4} className="lg:grid-cols-2">
        <CreationStatus shop={shop} />
        <UpgradeState shop={shop} />
      </DSGrid>

      <HealthDetails shop={shop} />

      <div className="flex justify-end">
        <ReRunSmokeButton shopId={shop} env="stage" />
      </div>
    </div>
  );
}
