import Link from "next/link";
import { listShops } from "../../../lib/listShops";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";
import { Grid } from "@ui/components/atoms/primitives/Grid";
import { Sidebar } from "@ui/components/atoms/primitives/Sidebar";

// i18n-exempt -- CMS-TECH-001 [ttl=2026-01-01]
const HERO_LABEL_CLASS = "text-hero-foreground/90";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";

export default async function DashboardIndexPage() {
  const t = await getTranslations("en");
  const shops = await listShops();
  const quickStats = [
    {
      label: t("cms.dashboard.stats.total.label"),
      value: shops.length,
      caption:
        shops.length === 0
          ? t("cms.dashboard.stats.total.caption.none")
          : shops.length === 1
            ? t("cms.dashboard.stats.total.caption.one", { count: shops.length })
            : t("cms.dashboard.stats.total.caption.many", { count: shops.length }),
    },
    {
      label: t("cms.dashboard.stats.focus.label"),
      value: shops.length === 0 ? t("cms.dashboard.stats.focus.setup") : t("cms.dashboard.stats.focus.manage"),
      caption:
        shops.length === 0
          ? t("cms.dashboard.stats.focus.caption.none")
          : t("cms.dashboard.stats.focus.caption.some"),
    },
  ];
  const progressValue = shops.length === 0 ? 12 : 100;
  const progressLabel =
    shops.length === 0
      ? t("cms.dashboard.progress.locked")
      : t("cms.dashboard.progress.ready");

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <Sidebar reverse sideWidth="w-80" gap={8} className="relative p-8 lg:items-start">
          <Card className="border border-border/20 bg-surface-2 text-foreground shadow-elevation-5">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("cms.dashboard.status.heading")}</h2>
                <p className="text-sm text-foreground">{t("cms.dashboard.status.desc")}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t("cms.dashboard.workspaceHealth.label")}</p>
                  <p className="text-xs text-foreground">
                    {shops.length === 0
                      ? t("cms.dashboard.workspaceHealth.empty")
                      : t("cms.dashboard.workspaceHealth.ready")}
                  </p>
                </div>
                <Tag className="shrink-0" variant={shops.length === 0 ? "warning" : "success"}>
                  {shops.length === 0 ? t("cms.dashboard.workspaceHealth.tag.action") : t("cms.dashboard.workspaceHealth.tag.ready")}
                </Tag>
              </div>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-hero-foreground/90">
                {t("cms.dashboard.shopDashboards.tag")}
              </span>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {t("cms.dashboard.shopDashboards.heading")}
              </h1>
              <p className="text-hero-foreground/90">{t("cms.dashboard.shopDashboards.desc")}</p>
            </div>
            <div className="space-y-4">
              <Progress value={progressValue} label={progressLabel} labelClassName={HERO_LABEL_CLASS} />
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">{t("cms.dashboard.actions.launchNewShop")}</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                >
                  <Link href="/cms">{t("cms.dashboard.actions.returnHome")}</Link>
                </Button>
              </div>
            </div>
            <Grid cols={1} gap={3} className="sm:grid-cols-2">
              {quickStats.map((stat) => (
                <Card
                  key={stat.label}
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
        </Sidebar>
      </section>

      <Card className="border border-border/60">
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">{t("cms.dashboard.availableShops.heading")}</h2>
            <Tag className="shrink-0" variant={shops.length === 0 ? "warning" : "default"}>
              {shops.length === 0 ? t("cms.dashboard.availableShops.noneTag") : t("cms.dashboard.availableShops.countTag", { count: shops.length })}
            </Tag>
          </div>
          {shops.length === 0 ? (
            <p className="text-sm text-foreground">{t("cms.dashboard.availableShops.empty")}</p>
          ) : (
            <Grid cols={1} gap={3} className="sm:grid-cols-2">
              {shops.map((shop) => (
                <Card key={shop} className="border border-border/60 bg-surface-3">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{shop}</p>
                      <p className="text-xs text-foreground">{t("cms.dashboard.shopCard.desc")}</p>
                    </div>
                    <Button asChild variant="outline" className="h-10 shrink-0 px-4 text-sm font-medium">
                      <Link href={`/cms/dashboard/${shop}`}>{t("cms.dashboard.shopCard.cta")}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
