import Link from "next/link";
import { listShops } from "../../../lib/listShops";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { buildMetrics } from "@cms/lib/analytics";
import { MarketingMetricCard } from "./components/MarketingMetricCard";
import { formatPrice } from "@acme/shared-utils";
import { Tag } from "@acme/ui";
import type { AnalyticsEvent } from "@platform-core/analytics";

type ShopSummary = {
  shop: string;
  campaigns: string[];
  emailOpens: number;
  emailClicks: number;
  revenue: number;
  discountRedemptions: number;
  clickRate: number;
  redemptionRate: number;
  topDiscountCode?: string;
};

export default async function MarketingPage() {
  const shops = await listShops();
  const summaries: ShopSummary[] = [];
  const discountTotals = new Map<string, number>();

  for (const shop of shops) {
    const events: AnalyticsEvent[] = await listEvents(shop);
    const campaigns = Array.from(
      new Set(
        events
          .map((e: AnalyticsEvent) =>
            typeof e.campaign === "string" ? e.campaign : null,
          )
          .filter(Boolean) as string[],
      ),
    );
    const metrics = buildMetrics(events);
    const discountCounts: Record<string, number> = {};
    for (const dataset of metrics.discountRedemptionsByCode.datasets) {
      const total = dataset.data.reduce((a, b) => a + b, 0);
      if (total > 0) discountCounts[dataset.label] = total;
    }
    const topDiscountEntry = Object.entries(discountCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    for (const [code, count] of Object.entries(discountCounts)) {
      discountTotals.set(code, (discountTotals.get(code) ?? 0) + count);
    }
    summaries.push({
      shop,
      campaigns,
      emailOpens: metrics.totals.emailOpens,
      emailClicks: metrics.totals.emailClicks,
      revenue: metrics.totals.campaignSales,
      discountRedemptions: metrics.totals.discountRedemptions,
      clickRate:
        metrics.totals.emailOpens > 0
          ? (metrics.totals.emailClicks / metrics.totals.emailOpens) * 100
          : 0,
      redemptionRate:
        metrics.totals.emailClicks > 0
          ? (metrics.totals.discountRedemptions / metrics.totals.emailClicks) *
            100
          : 0,
      topDiscountCode: topDiscountEntry?.[0],
    });
  }

  const totalCampaigns = summaries.reduce(
    (total, summary) => total + summary.campaigns.length,
    0,
  );
  const totalEmailOpens = summaries.reduce(
    (total, summary) => total + summary.emailOpens,
    0,
  );
  const totalEmailClicks = summaries.reduce(
    (total, summary) => total + summary.emailClicks,
    0,
  );
  const totalRevenue = summaries.reduce(
    (total, summary) => total + summary.revenue,
    0,
  );
  const totalDiscounts = summaries.reduce(
    (total, summary) => total + summary.discountRedemptions,
    0,
  );

  const aggregatedClickRate =
    totalEmailOpens > 0 ? (totalEmailClicks / totalEmailOpens) * 100 : 0;
  const aggregatedRedemptionRate =
    totalEmailClicks > 0 ? (totalDiscounts / totalEmailClicks) * 100 : 0;
  const activeShops = summaries.filter(
    (summary) => summary.campaigns.length > 0,
  ).length;
  const maxCampaigns = summaries.reduce(
    (max, summary) => Math.max(max, summary.campaigns.length),
    0,
  );
  const topDiscount = Array.from(discountTotals.entries()).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const hasAnyActivity =
    totalCampaigns > 0 ||
    totalEmailOpens > 0 ||
    totalRevenue > 0 ||
    totalDiscounts > 0;

  const shopsWithCampaigns = summaries.filter(
    (summary) => summary.campaigns.length > 0,
  );

  return (
    <div className="space-y-6 p-4">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Marketing Tools</h2>
        <p className="text-sm text-muted-foreground">
          Monitor campaign impact across shops and jump into the tools that help
          teams launch and iterate quickly.
        </p>
        <ul className="space-y-1 pl-6 text-sm leading-6">
          <li>
            <Link className="underline" href="/cms/marketing/email">
              Email Campaign
            </Link>
          </li>
          <li>
            <Link className="underline" href="/cms/marketing/discounts">
              Discount Codes
            </Link>
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Marketing performance</h3>
        {hasAnyActivity ? (
          <div className="grid gap-4 md:grid-cols-3">
            <MarketingMetricCard
              title="Tracked campaigns"
              value={totalCampaigns.toLocaleString()}
              tag={{
                label: `${activeShops} active ${activeShops === 1 ? "shop" : "shops"}`,
                variant: activeShops > 0 ? "success" : "default",
              }}
              progress={{
                value: maxCampaigns > 0 ? 100 : 0,
                label: `${summaries.length} total shops`,
              }}
              description="Unique campaigns observed across all storefronts."
            />
            <MarketingMetricCard
              title="Email engagement"
              value={`${totalEmailOpens.toLocaleString()} opens`}
              tag={{
                label: `${aggregatedClickRate.toFixed(1)}% CTR`,
                variant: aggregatedClickRate > 5 ? "success" : "default",
              }}
              progress={{
                value: Math.min(100, aggregatedClickRate),
                label: `${totalEmailClicks.toLocaleString()} clicks`,
              }}
              description="Shows how audiences are opening and clicking through marketing emails."
            />
            <MarketingMetricCard
              title="Attributed revenue"
              value={formatPrice(totalRevenue)}
              tag={{
                label: topDiscount?.[0]
                  ? `Top code: ${topDiscount[0]}`
                  : `${totalDiscounts.toLocaleString()} redemptions`,
                variant: totalDiscounts > 0 ? "success" : "default",
              }}
              progress={{
                value: Math.min(100, aggregatedRedemptionRate),
                label: `${aggregatedRedemptionRate.toFixed(1)}% redemption rate`,
              }}
              description="Revenue and discount usage attributed to tracked campaigns."
            />
          </div>
        ) : (
          <MarketingMetricCard
            title="Marketing analytics"
            emptyLabel="No marketing activity yet"
            description="Launch your first campaign to start collecting engagement and revenue metrics."
          />
        )}
      </section>

      {summaries.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Shop insights</h3>
          <div className="space-y-6">
            {summaries.map((summary) => (
              <div
                key={summary.shop}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-semibold">{summary.shop}</h4>
                  <Tag
                    className="text-xs font-medium"
                    variant={summary.campaigns.length > 0 ? "success" : "warning"}
                  >
                    {summary.campaigns.length > 0
                      ? `${summary.campaigns.length} active ${summary.campaigns.length === 1 ? "campaign" : "campaigns"}`
                      : "No active campaigns"}
                  </Tag>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <MarketingMetricCard
                    title="Campaigns"
                    value={summary.campaigns.length.toLocaleString()}
                    tag={{
                      label:
                        maxCampaigns > 0
                          ? `${summary.campaigns.length}/${maxCampaigns} of peer max`
                          : "",
                    }}
                    progress={{
                      value:
                        maxCampaigns > 0
                          ? (summary.campaigns.length / maxCampaigns) * 100
                          : 0,
                      label: "Campaign share",
                    }}
                    emptyLabel="No campaigns yet"
                  />
                  <MarketingMetricCard
                    title="Email opens"
                    value={summary.emailOpens.toLocaleString()}
                    tag={{
                      label: `${summary.clickRate.toFixed(1)}% CTR`,
                      variant: summary.clickRate > 5 ? "success" : "default",
                    }}
                    progress={{
                      value: Math.min(100, summary.clickRate),
                      label: `${summary.emailClicks.toLocaleString()} clicks`,
                    }}
                    emptyLabel="No engagement yet"
                  />
                  <MarketingMetricCard
                    title="Revenue impact"
                    value={formatPrice(summary.revenue)}
                    tag={{
                      label: summary.topDiscountCode
                        ? `Top code: ${summary.topDiscountCode}`
                        : `${summary.discountRedemptions.toLocaleString()} redemptions`,
                      variant:
                        summary.discountRedemptions > 0 ? "success" : "default",
                    }}
                    progress={{
                      value: Math.min(100, summary.redemptionRate),
                      label: `${summary.redemptionRate.toFixed(1)}% redemption rate`,
                    }}
                    emptyLabel="No revenue yet"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {shopsWithCampaigns.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Campaign Analytics</h3>
          {shopsWithCampaigns.map((summary) => (
            <div key={summary.shop} className="space-y-1">
              <h4 className="font-medium">{summary.shop}</h4>
              <ul className="list-disc pl-6">
                {summary.campaigns.map((campaign) => (
                  <li key={campaign}>
                    <Link
                      className="text-primary underline"
                      href={`/cms/dashboard/${summary.shop}?campaign=${encodeURIComponent(
                        campaign,
                      )}`}
                    >
                      {campaign}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
