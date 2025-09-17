import {
  listEvents,
  readAggregates,
} from "@platform-core/repositories/analytics.server";
import { readShop } from "@platform-core/repositories/shops.server";
import { Progress, Tag } from "@acme/ui";
import { MarketingMetricCard } from "../marketing/components/MarketingMetricCard";
import { CampaignFilter } from "./components/CampaignFilter.client";
import { Charts } from "./components/Charts.client";
import { buildMetrics } from "@cms/lib/analytics";
import { formatPrice } from "@acme/shared-utils";
import type { AnalyticsEvent, AnalyticsAggregates } from "@platform-core/analytics";
import type { Shop } from "@acme/types";

export default async function ShopDashboard({
  params,
  searchParams,
}: {
  params: { shop: string };
  searchParams: { campaign?: string | string[] };
}) {
  const shop = params.shop;
  const [events, aggregates, shopData] = (await Promise.all([
    listEvents(shop),
    readAggregates(shop),
    readShop(shop),
  ])) as [AnalyticsEvent[], AnalyticsAggregates, Shop];

  const domain = shopData.domain?.name;
  const domainStatus = shopData.domain?.status;

  const campaigns = Array.from(
    new Set(
      events
        .map((e: AnalyticsEvent) =>
          typeof e.campaign === "string" ? e.campaign : null
        )
        .filter(Boolean) as string[]
    )
  );

  const selected = searchParams?.campaign;
  const selectedCampaigns = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  const content =
    selectedCampaigns.length === 0
      ? (() => {
          const metrics = buildMetrics(events, aggregates);
          return (
            <>
              <Charts
                traffic={metrics.traffic}
                sales={metrics.sales}
                conversion={metrics.conversion}
                emailOpens={metrics.emailOpens}
                emailClicks={metrics.emailClicks}
                campaignSales={metrics.campaignSales}
                discountRedemptions={metrics.discountRedemptions}
                discountRedemptionsByCode={metrics.discountRedemptionsByCode}
                aiCrawl={metrics.aiCrawl}
              />
              {metrics.topDiscountCodes.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-semibold">Top discount codes</h3>
                  <ul className="list-inside list-disc">
                    {metrics.topDiscountCodes.map(([code, count]: [string, number]) => (
                      <li key={code}>
                        {code}: {count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold">Progress</h3>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email opens
                  </span>
                  <Progress
                    value={(metrics.totals.emailOpens / metrics.maxTotal) * 100}
                    label={String(metrics.totals.emailOpens)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Email clicks
                  </span>
                  <Progress
                    value={
                      (metrics.totals.emailClicks / metrics.maxTotal) * 100
                    }
                    label={String(metrics.totals.emailClicks)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Campaign sales
                  </span>
                  <Progress
                    value={
                      (metrics.totals.campaignSales / metrics.maxTotal) * 100
                    }
                    label={String(metrics.totals.campaignSales)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    Discount redemptions
                  </span>
                  <Progress
                    value={
                      (metrics.totals.discountRedemptions / metrics.maxTotal) *
                      100
                    }
                    label={String(metrics.totals.discountRedemptions)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-sm font-medium">
                    AI catalog requests
                  </span>
                  <Progress
                    value={(metrics.totals.aiCrawl / metrics.maxTotal) * 100}
                    label={String(metrics.totals.aiCrawl)}
                  />
                </div>
              </div>
            </>
          );
        })()
      : selectedCampaigns.map((c) => {
          const metrics = buildMetrics(
            events.filter((e: AnalyticsEvent) => e.campaign === c),
          );
          const totalTraffic = metrics.totals.emailClicks;
          const totalRevenue = metrics.totals.campaignSales;
          const conversionRate =
            totalTraffic > 0
              ? (metrics.totals.campaignSaleCount / totalTraffic) * 100
              : 0;
          const clickThroughRate =
            metrics.totals.emailOpens > 0
              ? (metrics.totals.emailClicks / metrics.totals.emailOpens) * 100
              : 0;
          const redemptionRate =
            metrics.totals.emailClicks > 0
              ? (metrics.totals.discountRedemptions / metrics.totals.emailClicks) *
                100
              : 0;
          const statusTag = metrics.totals.emailOpens > 0 ? "Active" : "Draft";
          return (
            <div key={c} className="mb-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">Campaign: {c}</h3>
                <Tag
                  variant={metrics.totals.emailOpens > 0 ? "success" : "default"}
                  className="text-xs font-medium"
                >
                  {statusTag}
                </Tag>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <MarketingMetricCard
                  title="Email opens"
                  value={metrics.totals.emailOpens.toLocaleString()}
                  tag={{
                    label: `${clickThroughRate.toFixed(1)}% CTR`,
                    variant: clickThroughRate > 5 ? "success" : "default",
                  }}
                  progress={{
                    value: Math.min(100, clickThroughRate),
                    label: `${metrics.totals.emailClicks.toLocaleString()} clicks`,
                  }}
                  emptyLabel="No engagement yet"
                />
                <MarketingMetricCard
                  title="Sales impact"
                  value={formatPrice(totalRevenue)}
                  tag={{
                    label: `${metrics.totals.campaignSaleCount.toLocaleString()} orders`,
                    variant:
                      metrics.totals.campaignSaleCount > 0
                        ? "success"
                        : "default",
                  }}
                  progress={{
                    value: Math.min(100, conversionRate),
                    label: `${conversionRate.toFixed(1)}% conversion`,
                  }}
                  emptyLabel="No revenue yet"
                />
                <MarketingMetricCard
                  title="Discount redemptions"
                  value={metrics.totals.discountRedemptions.toLocaleString()}
                  tag={{
                    label:
                      metrics.topDiscountCodes[0]?.[0]
                        ? `Top code: ${metrics.topDiscountCodes[0][0]}`
                        : "No redemptions",
                    variant:
                      metrics.totals.discountRedemptions > 0
                        ? "success"
                        : "default",
                  }}
                  progress={{
                    value: Math.min(100, redemptionRate),
                    label: `${redemptionRate.toFixed(1)}% of clicks`,
                  }}
                  emptyLabel="No redemptions yet"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Traffic: {totalTraffic.toLocaleString()} • Revenue: {" "}
                {formatPrice(totalRevenue)} • Conversion: {conversionRate.toFixed(2)}%
              </p>
              <Charts
                traffic={metrics.traffic}
                sales={metrics.sales}
                conversion={metrics.conversion}
                emailOpens={metrics.emailOpens}
                emailClicks={metrics.emailClicks}
                campaignSales={metrics.campaignSales}
                discountRedemptions={metrics.discountRedemptions}
                discountRedemptionsByCode={metrics.discountRedemptionsByCode}
                aiCrawl={metrics.aiCrawl}
              />
            </div>
          );
        });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard: {shop}</h2>
      {domain && (
        <p className="mb-2 text-sm text-gray-600">
          Domain: {domain} {domainStatus ? `(${domainStatus})` : ""}
        </p>
      )}
      {campaigns.length > 0 && <CampaignFilter campaigns={campaigns} />}
      {content}
    </div>
  );
}
