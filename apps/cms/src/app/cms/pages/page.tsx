// apps/cms/src/app/cms/pages/page.tsx

import Link from "next/link";

import { useTranslations as getServerTranslations } from "@acme/i18n/useTranslations.server";
import { Tag } from "@acme/ui/components/atoms";
import { Grid } from "@acme/ui/components/atoms/primitives/Grid";

import { Card, CardContent } from "@/components/atoms/shadcn";

import { listShops } from "../../../lib/listShops";

export default async function PagesIndexPage() {
  const shops = await listShops();
  const t = await getServerTranslations("en");

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border-1 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">{t("cms.pages.chooseShop.tag")}</Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {t("cms.pages.chooseShop.heading")}
          </h1>
          <p className="text-sm text-hero-foreground/90">
            {t("cms.pages.chooseShop.desc")}
          </p>
        </div>
      </section>

      <section>
        <Card className="border border-border-1 bg-surface-2 shadow-elevation-3">
          <CardContent className="p-6">
            <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop}
                href={`/cms/shop/${shop}/pages/edit/page`}
                className="group rounded-2xl border border-border-1 bg-surface-2 px-4 py-5 text-sm font-medium text-foreground shadow-elevation-1 transition hover:border-border-3 hover:bg-surface-3"
              >
                <span className="block text-xs uppercase tracking-wider text-foreground">{t("cms.breadcrumb.shop")}</span>
                <span className="text-lg font-semibold text-foreground">{shop.toUpperCase()}</span>
                <span className="mt-2 block text-xs text-foreground">
                  {t("cms.pages.card.desc")}
                </span>
              </Link>
            ))}
            {shops.length === 0 && (
              <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-5 text-sm text-foreground">
                {t("cms.pages.empty")}
              </div>
            )}
            </Grid>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
