// apps/cms/src/app/cms/shop/[shop]/products/page.tsx

import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import {
  createDraft,
  deleteProduct,
  duplicateProduct,
} from "@cms/actions/products.server";
import { authOptions } from "@cms/auth/options";
import { checkShopExists } from "@acme/lib";
import type { ProductPublication } from "@platform-core/products";
import { readRepo } from "@platform-core/repositories/json.server";
import ProductsTable from "@ui/components/cms/ProductsTable.client";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { Alert, Progress, Tag } from "@ui/components/atoms";
import { Inline } from "@ui/components/atoms/primitives";
import Link from "next/link";
import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import type { Locale } from "@acme/i18n/locales";
import { track } from "@acme/telemetry";
import {
  CmsBuildHero,
  CmsMetricTiles,
  CmsLaunchChecklist,
} from "@ui/components/cms"; // UI: @ui/components/cms/CmsBuildHero, CmsMetricTiles, CmsLaunchChecklist

export const revalidate = 0;

interface Params {
  shop: string;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */
  const { shop } = await params;

  if (!(await checkShopExists(shop))) return notFound();

  const [session, rows] = await Promise.all([
    getServerSession(authOptions),
    readRepo<ProductPublication>(shop),
  ]);

  const t = await getServerTranslations("en" as Locale);

  const isAdmin = session
    ? ["admin", "ShopAdmin", "CatalogManager", "ThemeEditor"].includes(
        session.user.role
      )
    : false;

  /* ---------------------------------------------------------------------- */
  /*  Server actions                                                        */
  /* ---------------------------------------------------------------------- */
  async function onCreate() {
    "use server";
    await createDraft(shop);
  }

  async function onDuplicate(shopParam: string, productId: string) {
    "use server";
    await duplicateProduct(shopParam, productId);
  }

  async function onDelete(shopParam: string, productId: string) {
    "use server";
    await deleteProduct(shopParam, productId);
  }

  const totalProducts = rows.length;
  const activeProducts = rows.filter((row) => row.status === "active").length;
  const draftProducts = rows.filter((row) => row.status === "draft").length;
  const archivedProducts = rows.filter((row) => row.status === "archived").length;
  const upcomingProducts = rows.filter((row) => row.status === "scheduled").length;

  const completeness = totalProducts
    ? Math.round((activeProducts / totalProducts) * 100)
    : 0;

  const quickStats = [
    {
      id: "active",
      label: t("cms.products.status.active"),
      value: String(activeProducts),
      caption: t("cms.products.status.active.caption"),
    },
    {
      id: "draft",
      label: t("cms.products.status.draft"),
      value: String(draftProducts),
      caption: t("cms.products.status.draft.caption"),
    },
    {
      id: "scheduled",
      label: t("cms.products.status.scheduled"),
      value: String(upcomingProducts),
      caption: t("cms.products.status.scheduled.caption"),
    },
    {
      id: "archived",
      label: t("cms.products.status.archived"),
      value: String(archivedProducts),
      caption: t("cms.products.status.archived.caption"),
    },
  ];

  if (isAdmin && totalProducts === 0) {
    track("build_flow_first_product_prompt_viewed", { shopId: shop });
  }

  const viewerNotice =
    !isAdmin &&
    t(
      "cms.products.viewerNotice",
    );

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative grid gap-6 px-6 py-7 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-4 lg:col-span-2">
            <CmsBuildHero
              tag={`${t("cms.products.tag.catalog")} · ${shop}`}
              title={t("cms.products.hero.title", { shop: shop.toUpperCase() })}
              body={t("cms.products.hero.subtitle")}
              tone="build"
            />
            {isAdmin && totalProducts === 0 && (
              <div
                className="space-y-2 text-sm text-hero-foreground/80"
                data-tour="quest-product"
              >
                <div className="space-y-1">
                  <p>{t("cms.products.firstProduct.headline")}</p>
                  <p>{t("cms.products.firstProduct.subtitle")}</p>
                  <p className="text-xs text-hero-foreground/70">
                    {t("cms.products.firstProduct.timeEstimate")}
                  </p>
                </div>
                <Inline
                  alignY="center"
                  gap={2}
                  wrap={false}
                  className="w-fit rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground"
                >
                  {t("cms.configurator.time.badge.product")}
                </Inline>
              </div>
            )}
            <div className="space-y-4">
              <Progress
                value={completeness}
                label={t("cms.products.progress.label", {
                  active: activeProducts,
                  total: totalProducts || 0,
                })}
                labelClassName="text-hero-foreground/80" // i18n-exempt -- DS-1023: class names [ttl=2026-12-31]
              />
              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && totalProducts === 0 ? (
                  <>
                    <Button
                      asChild
                      className="h-11 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
                    >
                      <Link href={`/cms/shop/${shop}/products/first`}>
                        {t("cms.products.firstWizard.actions.create")}
                      </Link>
                    </Button>
                    <form action={onCreate}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-11 rounded-xl border-border/40 px-5 text-sm font-semibold text-foreground hover:bg-surface-3"
                      >
                        {t("cms.products.actions.addNew")}
                      </Button>
                    </form>
                  </>
                ) : isAdmin ? (
                  <form action={onCreate}>
                    <Button
                      type="submit"
                      className="h-11 rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 hover:bg-success/90"
                    >
                      {t("cms.products.actions.addNew")}
                    </Button>
                  </form>
                ) : null}
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-border/40 px-5 text-sm font-semibold text-foreground hover:bg-surface-3"
                >
                  <Link href={`/cms/shop/${shop}/pages/new/page`}>
                    {t("cms.products.actions.buildMerchPage")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-xl border-border/40 px-5 text-sm font-semibold text-foreground hover:bg-surface-3"
                >
                  <Link href={`/cms/shop/${shop}/pages/new/componenteditor`}>
                    {t("cms.products.actions.openComponentEditor")}
                  </Link>
                </Button>
              </div>
            </div>
            <CmsMetricTiles items={quickStats} />
          </div>
          <Card className="border-border/10 bg-surface-2 text-foreground shadow-elevation-4 lg:col-span-1">
            <CardContent className="space-y-4 p-6">
              <CmsLaunchChecklist
                heading={String(t("cms.products.launchChecklist.title"))}
                readyLabel={String(t("cms.products.launchChecklist.readyLabel"))}
                showReadyCelebration
                items={[
                  {
                    id: "review-drafts",
                    label: String(t("cms.products.launchChecklist.items.reviewDrafts")),
                    status: draftProducts > 0 ? "warning" : "complete",
                    statusLabel:
                      draftProducts > 0
                        ? String(t("cms.configurator.launchChecklist.status.warning"))
                        : String(t("cms.configurator.launchChecklist.status.complete")),
                    fixLabel: String(t("cms.configurator.launchChecklist.fix")),
                    onFix: () => {
                      // Navigate to the products list; filtering drafts is a later enhancement.
                      window.location.href = `/cms/shop/${shop}/products`;
                    },
                  },
                  {
                    id: "schedule-releases",
                    label: String(t("cms.products.launchChecklist.items.scheduleReleases")),
                    status: upcomingProducts > 0 ? "complete" : "pending",
                    statusLabel:
                      upcomingProducts > 0
                        ? String(t("cms.configurator.launchChecklist.status.complete"))
                        : String(t("cms.configurator.launchChecklist.status.pending")),
                    fixLabel: String(t("cms.configurator.launchChecklist.fix")),
                    onFix: () => {
                      window.location.href = `/cms/shop/${shop}/products/new`;
                    },
                  },
                  {
                    id: "archive-aging",
                    label: String(t("cms.products.launchChecklist.items.archiveAging")),
                    status: "pending",
                    statusLabel: String(t("cms.configurator.launchChecklist.status.pending")),
                    fixLabel: String(t("cms.configurator.launchChecklist.fix")),
                    onFix: () => {
                      window.location.href = `/cms/shop/${shop}/products`;
                    },
                  },
                ]}
              />
              <Button asChild variant="outline" className="h-10 w-full">
                <Link href={`/cms/shop/${shop}/pages/edit/page`}>
                  {t("cms.products.launchChecklist.preview")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <Card className="border border-border/10 bg-surface-2 text-foreground shadow-elevation-3">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("cms.products.catalogOverview.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("cms.products.catalogOverview.subtitle")}</p>
              </div>
              <Tag className="shrink-0" variant="default">
                {t("cms.products.totalProducts", { count: totalProducts })}
              </Tag>
            </div>
            <ProductsTable
              shop={shop}
              rows={rows}
              isAdmin={isAdmin}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </CardContent>
        </Card>

        {viewerNotice && (
          <Alert variant="warning" tone="soft" heading={viewerNotice} />
        )}
      </section>
    </div>
  );
}
