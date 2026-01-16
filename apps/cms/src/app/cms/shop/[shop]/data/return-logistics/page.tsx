import { checkShopExists } from "@acme/lib";
import { readReturnLogistics } from "@acme/platform-core/repositories/returnLogistics.server";
import { notFound } from "next/navigation";
import ReturnLogisticsForm from "./ReturnLogisticsForm";
import { Card, CardContent } from "@/components/atoms/shadcn";
import { Tag } from "@acme/ui/components/atoms";
import { Grid } from "@acme/ui/components/atoms/primitives";
import { cn } from "@acme/ui/utils/style";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { TranslationsProvider } from "@acme/i18n/Translations";
import en from "@acme/i18n/en.json";

export const revalidate = 0;

export default async function ReturnLogisticsPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const { shop } = await params;
  if (!(await checkShopExists(shop))) return notFound();
  const initial = await readReturnLogistics();
  const t = await getTranslations("en");
  const i = (msg: string, vars: Record<string, string | number>) =>
    msg.replace(/\{(.*?)\}/g, (m, name) => (vars[name] ?? m) as string);
  const carrierCount = initial.returnCarrier.length;
  const pickupZipCount = initial.homePickupZipCodes.length;
  const trackingEnabled = Boolean(initial.tracking);
  const inStoreEnabled = Boolean(initial.inStore);

  const quickStats = [
    {
      label: t("cms.returnLogistics.stats.carriers.label") as string,
      value: String(carrierCount || 0),
      caption: t("cms.returnLogistics.stats.carriers.caption") as string,
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.returnLogistics.stats.pickupZips.label") as string,
      value: String(pickupZipCount || 0),
      caption: t("cms.returnLogistics.stats.pickupZips.caption") as string,
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.returnLogistics.stats.tracking.label") as string,
      value: trackingEnabled ? (t("common.enabled") as string) : (t("common.disabled") as string),
      caption: trackingEnabled
        ? (t("cms.returnLogistics.stats.tracking.captionEnabled") as string)
        : (t("cms.returnLogistics.stats.tracking.captionDisabled") as string),
      accent: trackingEnabled ? "bg-primary-soft text-foreground" : "bg-muted/20 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
    {
      label: t("cms.returnLogistics.stats.inStore.label") as string,
      value: inStoreEnabled ? (t("common.allowed") as string) : (t("common.disabled") as string),
      caption: inStoreEnabled
        ? (t("cms.returnLogistics.stats.inStore.captionAllowed") as string)
        : (t("cms.returnLogistics.stats.inStore.captionDisabled") as string),
      accent: inStoreEnabled ? "bg-warning-soft text-foreground" : "bg-muted/20 text-foreground", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
    },
  ];

  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <div className="relative space-y-4 px-6 py-7">
          <Tag variant="default">
            {i(t("cms.returnLogistics.tag") as string, { shop })}
          </Tag>
          <h1 className="text-3xl font-semibold md:text-4xl">
            {t("cms.returnLogistics.heading")}
          </h1>
          <p className="text-sm text-hero-foreground/80">
            {t("cms.returnLogistics.subheading")}
          </p>
          <Grid gap={3} cols={1} className="sm:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-2xl border border-border/10 px-4 py-3 backdrop-blur", // i18n-exempt -- CMS-2417 CSS utility classes only [ttl=2025-12-31]
                  stat.accent
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.caption}</p>
              </div>
            ))}
          </Grid>
        </div>
      </section>

      <section>
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-4 px-6 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{t("cms.returnLogistics.controls.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("cms.returnLogistics.controls.description")}
                </p>
              </div>
            </div>
            <ReturnLogisticsForm shop={shop} initial={initial} />
          </CardContent>
        </Card>
      </section>
      </div>
    </TranslationsProvider>
  );
}
