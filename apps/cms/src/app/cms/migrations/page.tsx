import Link from "next/link";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";
import { Grid } from "@acme/ui/components/atoms/primitives";
import { useTranslations as getTranslations } from "@acme/i18n/useTranslations.server";
import { TranslationsProvider } from "@acme/i18n/Translations";
import en from "@acme/i18n/en.json";

export default async function MigrationsPage() {
  const t = await getTranslations("en");

  // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  const progressLabelClass = "text-hero-foreground/80";

  const quickStats = [
    {
      label: t("cms.migrations.stats.flow.label"),
      value: t("cms.migrations.stats.flow.value"),
      caption: t("cms.migrations.stats.flow.caption"),
    },
    {
      label: t("cms.migrations.stats.focus.label"),
      value: t("cms.migrations.stats.focus.value"),
      caption: t("cms.migrations.stats.focus.caption"),
    },
    {
      label: t("cms.migrations.stats.env.label"),
      value: t("cms.migrations.stats.env.value"),
      caption: t("cms.migrations.stats.env.caption"),
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
                  {t("cms.migrations.title")}
                </span>
                <h1 className="text-3xl font-semibold md:text-4xl">
                  {t("cms.migrations.hero.title")}
                </h1>
                <p className="text-hero-foreground/80">
                  {t("cms.migrations.hero.desc")}
                </p>
              </div>
              <div className="space-y-4">
                <Progress value={30} label={t("cms.migrations.progress.label")} labelClassName={progressLabelClass} />
                <div className="flex flex-wrap gap-3">
                  <Button asChild className="h-11 px-5 text-sm font-semibold">
                    <Link href="/cms/configurator">{t("cms.migrations.actions.openConfigurator")}</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                  >
                    <Link href="/cms">{t("cms.migrations.actions.returnHome")}</Link>
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
            <Card className="lg:col-span-1 border border-border/20 bg-surface-2 text-foreground shadow-elevation-5">
              <CardContent className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{t("cms.migrations.status.title")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("cms.migrations.status.desc")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("cms.migrations.status.automation.label")}</p>
                    <p className="text-xs text-muted-foreground">{t("cms.migrations.status.automation.caption")}</p>
                  </div>
                  <Tag className="shrink-0" variant="warning">{t("cms.migrations.status.automation.tag")}</Tag>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </section>

        <Card className="border border-border/60">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{t("cms.migrations.cli.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("cms.migrations.cli.desc")}
            </p>
            <Card className="border border-border/60 bg-surface-3">
              <CardContent className="font-mono text-sm text-foreground">
                {t("cms.migrations.cli.command")}
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              {t("cms.migrations.cli.postDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    </TranslationsProvider>
  );
}
