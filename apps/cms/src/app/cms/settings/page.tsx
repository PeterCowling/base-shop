// apps/cms/src/app/cms/settings/page.tsx

import Link from "next/link";
import SettingsShopChooser from "./SettingsShopChooser.client";
import { Button, Card, CardContent, Tag } from "@acme/ui/components/atoms";
import { Grid as DSGrid, Inline } from "@acme/ui/components/atoms/primitives";
import { listShops } from "../../../lib/listShops";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";

export default async function SettingsIndexPage() {
  const shops = await listShops();
  const t = await getTranslations("en");
  const SHOP_SELECTION_ID = "shop-selection"; /* i18n-exempt */
  const featureHighlights = [
    {
      title: t("cms.settings.index.features.policy.title"),
      description: t("cms.settings.index.features.policy.desc"),
    },
    {
      title: t("cms.settings.index.features.team.title"),
      description: t("cms.settings.index.features.team.desc"),
    },
    {
      title: t("cms.settings.index.features.integrations.title"),
      description: t("cms.settings.index.features.integrations.desc"),
    },
  ];
  return (
    <div className="space-y-8 text-foreground">
      <Card className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <CardContent className="relative p-8">
          <DSGrid cols={1} gap={8} className="lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="space-y-3">
              <Tag variant="default">
                {t("cms.settings.index.tag")}
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {t("cms.settings.index.title")}
              </h1>
              <p className="text-sm text-hero-foreground/80">
                {t("cms.settings.index.subtitle")}
              </p>
            </div>
            <Inline wrap gap={3}>
              <Button asChild className="h-11 px-5 text-sm font-semibold">
                <Link href="/cms/configurator">{t("cms.settings.index.create")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
              >
                <Link href="#shop-selection">{t("cms.settings.index.browse")}</Link>
              </Button>
            </Inline>
          </div>
          <DSGrid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-1">
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
          </DSGrid>
          </DSGrid>
        </CardContent>
      </Card>

      <div id={SHOP_SELECTION_ID} className="scroll-mt-32">
        <SettingsShopChooser shops={shops} />
      </div>
    </div>
  );
}
