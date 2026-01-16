"use client";

import Link from "next/link";
import { Button, Card, CardContent, Progress, Tag } from "@/components/atoms/shadcn";
import { Grid as DSGrid } from "@acme/ui/components/atoms/primitives";
import { useTranslations } from "@acme/i18n";
import { JumpLinkButton } from "@cms/app/cms/components/JumpLinkButton";
import { buildQuickStats } from "@cms/lib/dashboardClient";
import type { Stats } from "@cms/lib/dashboardData";

type DashboardHeroProps = {
  stats: Stats;
  pendingCount: number;
  canManageRequests: boolean;
  pendingHeadingId: string;
};

export function DashboardHero({
  stats,
  pendingCount,
  canManageRequests,
  pendingHeadingId,
}: DashboardHeroProps) {
  const t = useTranslations();
  const quickStats = buildQuickStats(stats);
  const totalAccounts = stats.users + pendingCount;
  const approvalProgress =
    totalAccounts === 0 ? 100 : Math.round((stats.users / totalAccounts) * 100);
  const progressLabel =
    pendingCount === 0
      ? t("All account requests processed")
      : `${pendingCount} ${t("pending")} ${pendingCount === 1 ? t("request") : t("requests")}`;

  const heroDescription =
    stats.shops === 0
      ? t(
          "Create your first shop to unlock dashboards, live previews, and automated maintenance."
        )
      : t(
          "Monitor storefront performance, team access, and catalog health from a single control centre."
        );

  const pendingSummaryVariant = pendingCount === 0 ? "success" : "warning";
  const pendingSummaryText =
    pendingCount === 0
      ? t("No pending approvals")
      : `${pendingCount} ${t("awaiting review")}`;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border-3 bg-hero-contrast text-hero-foreground shadow-elevation-4">
      <DSGrid cols={1} gap={8} className="relative p-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-hero-foreground/80">
              {t("Base-Shop CMS")}
            </span>
            <h1 className="text-3xl font-semibold md:text-4xl">
              {t("Operate every storefront with confidence")}
            </h1>
            <p className="text-hero-foreground/80">{heroDescription}</p>
          </div>
          <div className="space-y-4">
            <Progress
              value={approvalProgress}
              label={progressLabel}
              labelClassName={
                // i18n-exempt: utility class for label styling, not user copy
                "text-hero-foreground/80"
              }
            />
            <div className="flex flex-wrap gap-3">
              {canManageRequests && (
                <Button asChild className="h-11 px-5 text-sm font-semibold">
                  <Link href="/cms/configurator">{t("Create new shop")}</Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
              >
                <Link href="/cms/dashboard">{t("View shop dashboards")}</Link>
              </Button>
              {canManageRequests && pendingCount > 0 && (
                <JumpLinkButton
                  targetId={pendingHeadingId}
                  variant="outline"
                  className="h-11 px-5 text-sm font-semibold border-primary/40 text-hero-foreground hover:bg-primary/10"
                >
                  {t("Review account requests")}
                </JumpLinkButton>
              )}
            </div>
          </div>
        <DSGrid cols={1} gap={3} className="sm:grid-cols-3">
          {quickStats.map((stat) => (
            <Card
              key={stat.label}
              className="border border-primary/20 bg-surface-2 text-foreground"
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
        </DSGrid>
        </div>
        <div className="lg:col-span-1">
          <Card className="border border-border-2 bg-surface-2 text-foreground shadow-elevation-5">
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{t("Access control")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("Keep the workspace safe by approving new teammates promptly.")}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-1 bg-surface-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t("Pending approvals")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("We’ll surface new requests as soon as they arrive.")}
                  </p>
                </div>
                <Tag className="shrink-0" variant={pendingSummaryVariant}>{pendingSummaryText}</Tag>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Assign the right mix of roles so each collaborator has the access they need."
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      </DSGrid>
    </section>
  );
}
