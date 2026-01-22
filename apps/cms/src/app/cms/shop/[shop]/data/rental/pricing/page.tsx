import { notFound } from "next/navigation";

import { Tag } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import en from "@acme/i18n/en.json";
import { TranslationsProvider } from "@acme/i18n/Translations";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { formatNumber } from "@acme/lib/format";
import { readPricing } from "@acme/platform-core/repositories/pricing.server";
import { checkShopExists } from "@acme/platform-core/shops";

import { Card, CardContent } from "@/components/atoms/shadcn";

import PricingForm from "./PricingForm";

export const revalidate = 0;

export default async function PricingPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readPricing();
  const t = await getTranslations("en");

  const i = (msg: string, vars: Record<string, string | number>) =>
    msg.replace(/\{(.*?)\}/g, (m, name) => (vars[name] ?? m) as string);

  const tiers = initial.durationDiscounts.length;
  const depositCodes = Object.entries(initial.damageFees).filter(([, value]) => value === "deposit").length;
  const coverageEnabled = Object.keys(initial.coverage ?? {}).length;

  const quickStats = [
    {
      label: t("cms.rentalPricing.stats.baseRate.label") as string,
      value: `$${formatNumber(initial.baseDailyRate, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      caption: t("cms.rentalPricing.stats.baseRate.caption") as string,
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.rentalPricing.stats.discountTiers.label") as string,
      value: tiers ? String(tiers) : (t("common.none") as string),
      caption: tiers
        ? (t("cms.rentalPricing.stats.discountTiers.captionSome") as string)
        : (t("cms.rentalPricing.stats.discountTiers.captionNone") as string),
      accent: tiers ? "bg-info-soft text-foreground" : "bg-muted/20 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.rentalPricing.stats.depositDefaults.label") as string,
      value: depositCodes
        ? (i(t("cms.rentalPricing.stats.depositDefaults.value") as string, { count: depositCodes }) as string)
        : (t("common.none") as string),
      caption: depositCodes
        ? (t("cms.rentalPricing.stats.depositDefaults.captionSome") as string)
        : (t("cms.rentalPricing.stats.depositDefaults.captionNone") as string),
      accent: depositCodes ? "bg-warning-soft text-foreground" : "bg-muted/20 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.rentalPricing.stats.coverageEntries.label") as string,
      value: coverageEnabled ? String(coverageEnabled) : (t("common.optional") as string),
      caption: coverageEnabled
        ? (t("cms.rentalPricing.stats.coverageEntries.captionSome") as string)
        : (t("cms.rentalPricing.stats.coverageEntries.captionNone") as string),
      accent: coverageEnabled ? "bg-primary-soft text-foreground" : "bg-muted/20 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
  ];

  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-8">
          <Tag variant="default">
            {i(t("cms.rentalPricing.tag") as string, { shop })}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">{t("cms.rentalPricing.heading")}</h1>
          <p className="text-sm text-hero-foreground/80 md:text-base">
            {t("cms.rentalPricing.subheading")}
          </p>
          <Grid gap={3} cols={1} className="sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-border/10 px-4 py-3 text-xs text-muted-foreground backdrop-blur", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
                  stat.accent
                )}
              >
                <p className="font-semibold uppercase tracking-wide">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.caption}</p>
              </div>
            ))}
          </Grid>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 text-foreground shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("cms.rentalPricing.controls.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("cms.rentalPricing.controls.description")}
                </p>
              </div>
            </div>
            <PricingForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
      </div>
    </TranslationsProvider>
  );
}
