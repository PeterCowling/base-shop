import { Card, CardContent, Progress, Button, Tag } from "@/components/atoms/shadcn";
import { Grid } from "@/components/atoms/primitives";
import Link from "next/link";
import { MaintenanceScanner } from "./MaintenanceScanner";
import { scanForMaintenance } from "./scan.server";
import { MSG_ITEM_NEEDS_MAINTENANCE, MSG_ITEM_NEEDS_RETIREMENT } from "./constants";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { TranslationsProvider } from "@acme/i18n/Translations";
import en from "@acme/i18n/en.json";

// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const HERO_LABEL_CLASS = "text-hero-foreground/80";

export const revalidate = 0;

export default async function MaintenancePage() {
  const t = await getTranslations("en");
  const flagged = await scanForMaintenance();
  const retireCount = flagged.filter((item) => item.message === MSG_ITEM_NEEDS_RETIREMENT).length;
  const maintenanceCount = flagged.filter((item) => item.message === MSG_ITEM_NEEDS_MAINTENANCE).length;
  const progressValue = flagged.length === 0 ? 100 : Math.max(10, 100 - flagged.length * 20);
  const progressLabel =
    flagged.length === 0
      ? t("cms.maintenance.progress.optimal")
      : t("cms.maintenance.progress.pending.count", {
          count: flagged.length,
          unit: t(
            flagged.length === 1
              ? "cms.maintenance.progress.pending.unit.singular"
              : "cms.maintenance.progress.pending.unit.plural",
          ),
        });

  const quickStats = [
    {
      label: t("cms.maintenance.stats.flagged.label"),
      value: flagged.length,
      caption:
        flagged.length === 0
          ? t("cms.maintenance.stats.flagged.caption.zero")
          : t("cms.maintenance.stats.flagged.caption.other"),
    },
    {
      label: t("cms.maintenance.stats.retire.label"),
      value: retireCount,
      caption:
        retireCount === 0
          ? t("cms.maintenance.stats.retire.caption.zero")
          : t("cms.maintenance.stats.retire.caption.other", { count: retireCount }),
    },
    {
      label: t("cms.maintenance.stats.maintain.label"),
      value: maintenanceCount,
      caption:
        maintenanceCount === 0
          ? t("cms.maintenance.stats.maintain.caption.zero")
          : t("cms.maintenance.stats.maintain.caption.other", { count: maintenanceCount }),
    },
  ];

  return (
    <TranslationsProvider messages={en}>
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
          <Grid cols={1} gap={8} className="relative p-8 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-6 lg:col-span-2">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-hero-foreground/80">
                  {t("cms.maintenance.title")}
                </span>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  {t("cms.maintenance.hero.title")}
                </h1>
                <p className="text-hero-foreground/80">
                  {t("cms.maintenance.hero.desc")}
                </p>
              </div>
              <div className="space-y-4">
                <Progress value={progressValue} label={progressLabel} labelClassName={HERO_LABEL_CLASS} />
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="h-11 px-5 text-sm font-semibold">
                    <Link href="/cms">{t("cms.maintenance.actions.backHome")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                  >
                    <Link href="/cms/live">{t("cms.maintenance.actions.checkLive")}</Link>
                  </Button>
                </div>
              </div>
              <Grid cols={1} gap={3} className="sm:grid-cols-3">
                {quickStats.map((stat) => (
                  <Card
                    key={String(stat.label)}
                    className="border border-primary/15 bg-surface-2 text-foreground"
                  >
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.caption}</p>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </div>
            <Card className="border border-border/20 bg-surface-2 text-foreground shadow-elevation-5 lg:col-span-1">
              <CardContent className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{t("cms.maintenance.status.title")}</h2>
                  <p className="text-sm text-foreground">
                    {t("cms.maintenance.status.desc")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("cms.maintenance.status.posture.label")}</p>
                    <p className="text-xs text-foreground">
                      {flagged.length === 0
                        ? t("cms.maintenance.status.posture.zero")
                        : t("cms.maintenance.status.posture.other", { count: flagged.length })}
                    </p>
                  </div>
                  <Tag className="shrink-0" variant={flagged.length === 0 ? "success" : "warning"}>
                    {flagged.length === 0
                      ? t("cms.maintenance.status.tag.healthy")
                      : t("cms.maintenance.status.tag.action")}
                  </Tag>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </section>

        <MaintenanceScanner initial={flagged} />
      </div>
    </TranslationsProvider>
  );
}
