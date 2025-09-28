// apps/cms/src/app/cms/orders/[shop]/page.tsx
import { readOrders, markReturned, markRefunded } from "@platform-core/orders";
import type { RentalOrder } from "@acme/types";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { Tag, Progress } from "@ui/components/atoms";
import { Grid } from "@ui/components/atoms/primitives";
import { cn } from "@ui/utils/style";
import Link from "next/link";
import { useTranslations as getTranslations } from "@i18n/useTranslations.server";

export default async function ShopOrdersPage({
  params,
}: {
  params: Promise<{ shop: string }>;
}) {
  const shop = (await params).shop;
  const orders: RentalOrder[] = await readOrders(shop);
  const t = await getTranslations("en");

  const totalOrders = orders.length;
  const flaggedOrders = orders.filter((order) => order.flaggedForReview);
  const highRiskOrders = orders.filter(
    (order) => (order.riskLevel ?? "").toString().toLowerCase() === "high"
  );
  const expectedReturns = orders.filter((order) => Boolean(order.expectedReturnDate));

  const now = Date.now();
  const overdueReturns = expectedReturns.filter((order) => {
    const expected = order.expectedReturnDate;
    if (!expected) return false;
    const date = new Date(expected);
    return Number.isFinite(date.getTime()) && date.getTime() < now;
  });

  const readiness = totalOrders
    ? Math.max(0, Math.min(100, 100 - Math.round((overdueReturns.length / totalOrders) * 100)))
    : 0;

  // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  const progressLabelClass = "text-hero-foreground/90";

  const quickStats = [
    {
      label: t("cms.orders.stats.placed.label"),
      value: String(totalOrders),
      caption: t("cms.orders.stats.placed.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    },
    {
      label: t("cms.orders.stats.flagged.label"),
      value: String(flaggedOrders.length),
      caption: t("cms.orders.stats.flagged.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    },
    {
      label: t("cms.orders.stats.highRisk.label"),
      value: String(highRiskOrders.length),
      caption: t("cms.orders.stats.highRisk.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    },
    {
      label: t("cms.orders.stats.overdue.label"),
      value: String(overdueReturns.length),
      caption: t("cms.orders.stats.overdue.caption"),
      accent: "bg-surface-3 text-foreground", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    },
  ];

  async function returnAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markReturned(shop, sessionId);
    }
  }

  async function refundAction(formData: FormData) {
    "use server";
    const sessionId = formData.get("sessionId")?.toString();
    if (sessionId) {
      await markRefunded(shop, sessionId);
    }
  }

  return (
    <div className="space-y-8 text-foreground">
      <section className="relative overflow-hidden rounded-3xl border border-border/10 bg-hero-contrast text-hero-foreground shadow-elevation-4">
        <Grid cols={1} gap={6} className="relative px-6 py-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-5 lg:col-span-2">
            <div className="space-y-2">
              <Tag variant="default">
                {t("cms.orders.tag", { shop })}
              </Tag>
              <h1 className="text-3xl font-semibold md:text-4xl">
                {t("cms.orders.heading")}
              </h1>
              <p className="text-sm text-hero-foreground/90">
                {t("cms.orders.subheading")}
              </p>
            </div>
            <div className="space-y-4">
              <Progress value={readiness} label={t("cms.orders.progress", { pct: readiness }) as string} labelClassName={progressLabelClass} />
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/cms/shop/${shop}/settings/returns`}
                  className="inline-flex h-11 items-center rounded-xl bg-success px-5 text-sm font-semibold text-success-foreground shadow-elevation-2 transition hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success"
                >
                  {t("cms.orders.reviewReturnPolicies")}
                </Link>
                <Link
                  href={`/cms/shop/${shop}/data/return-logistics`}
                  className="inline-flex h-11 items-center rounded-xl border border-border/40 px-5 text-sm font-semibold text-foreground transition hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t("cms.orders.openLogisticsData")}
                </Link>
              </div>
            </div>
            <Grid cols={1} gap={3} className="sm:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-2xl border border-border/10 px-4 py-3", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
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
          <Card className="lg:col-span-1 border-border/10 bg-surface-2 text-foreground shadow-elevation-3">
            <CardContent className="space-y-3 p-6 text-sm text-muted-foreground">
              <h2 className="text-base font-semibold text-foreground">{t("cms.orders.tips.title")}</h2>
              <p>• {t("cms.orders.tips.bullets.0")}</p>
              <p>• {t("cms.orders.tips.bullets.1")}</p>
              <p>• {t("cms.orders.tips.bullets.2")}</p>
              {!!flaggedOrders.length && (
                <Tag variant="warning">
                  {t("cms.orders.tips.flaggedTag", { count: flaggedOrders.length })}
                </Tag>
              )}
            </CardContent>
          </Card>
        </Grid>
      </section>

      <section className="space-y-4">
        <Card className="border border-border/10 bg-surface-2 shadow-elevation-3">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-foreground">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("cms.orders.queue.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("cms.orders.queue.subtitle")}</p>
              </div>
              <Tag className="shrink-0" variant="default">
                {t("cms.orders.totalOrdersTag", { count: totalOrders })}
              </Tag>
            </div>
            <Grid cols={1} gap={3} role="list">
              {orders.map((order) => {
                const expected = order.expectedReturnDate
                  ? new Date(order.expectedReturnDate)
                  : null;
                const isOverdue = expected
                  ? Number.isFinite(expected.getTime()) && expected.getTime() < now
                  : false;
                const riskLevel = order.riskLevel ?? (t("cms.orders.risk.unknown") as string);
                const riskScore = typeof order.riskScore === "number" ? order.riskScore : "N/A";
                const riskLevelLower = riskLevel.toString().toLowerCase();
                const highlight =
                  order.flaggedForReview || riskLevelLower === "high" || isOverdue;

                return (
                  <div
                    role="listitem"
                    key={order.id ?? order.sessionId}
                  className={cn(
                    "list-none rounded-2xl border", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
                    highlight ? "border-danger/40 bg-surface-2" : "border-transparent" // i18n-exempt -- ABC-123 [ttl=2025-12-31]
                  )}
                  >
                    <Card
                      className={cn(
                        "border border-border/10 bg-surface-2 text-foreground", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
                        order.flaggedForReview && "border-danger/40", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
                        isOverdue && "border-warning/40" // i18n-exempt -- ABC-123 [ttl=2025-12-31]
                      )}
                    >
                      <CardContent className="space-y-3 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="text-sm font-semibold">
                              {t("cms.orders.orderLabel", { id: order.id ?? t("common.unknown") })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("cms.orders.sessionLabel", { id: order.sessionId ?? "—" })}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {order.flaggedForReview && (
                              <Tag variant="warning">
                                {t("cms.orders.flaggedForReview")}
                              </Tag>
                            )}
                            <Tag
                              variant={riskLevelLower === "high" ? "destructive" : "default"}
                            >
                              {t("cms.orders.riskLevelLabel", { level: riskLevel })}
                            </Tag>
                            <Tag variant="default">
                              {t("cms.orders.riskScoreLabel", { score: riskScore })}
                            </Tag>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.expectedReturnDate ? (
                            <>
                              {t("cms.orders.returnLabel", { date: order.expectedReturnDate })}
                              {expected && Number.isFinite(expected.getTime()) && (
                                <span aria-hidden="true" className="ms-2 text-muted-foreground">
                                  ({expected.toLocaleDateString()})
                                </span>
                              )}
                              {isOverdue && (
                                <span className="text-warning-foreground"> {t("cms.orders.overdueSuffix")}</span>
                              )}
                            </>
                          ) : (
                            <>{t("cms.orders.returnUnknown")}</>
                          )}
                        </p>
                        <div className="text-sm text-muted-foreground">
                          {t("cms.orders.flaggedForReviewStatus", { status: order.flaggedForReview ? t("common.yes") : t("common.no") })}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <form action={returnAction}>
                            <input type="hidden" name="sessionId" value={order.sessionId ?? ""} />
                            <Button
                              type="submit"
                              variant="outline"
                              className="h-9 rounded-lg border-border/30 bg-surface-2 text-foreground hover:bg-surface-3"
                            >
                              {t("cms.orders.actions.markReturned")}
                            </Button>
                          </form>
                          <form action={refundAction}>
                            <input type="hidden" name="sessionId" value={order.sessionId ?? ""} />
                            <Button
                              type="submit"
                              variant="ghost"
                              className="h-9 rounded-lg text-foreground hover:bg-surface-3"
                            >
                              {t("cms.orders.actions.refundOrder")}
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <div role="listitem" className="list-none">
                  <Card className="border border-border/10 bg-surface-2 text-foreground">
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                      {t("cms.orders.empty")}
                    </CardContent>
                  </Card>
                </div>
              )}
            </Grid>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
