import Link from "next/link";
import { Button, Card, CardContent, Tag } from "@ui/components/atoms";
import { AnalyticsSummaryCard } from "@ui/components/cms/marketing";

export interface CampaignEngagementMetrics {
  sent: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

export interface SegmentActivityMetric {
  id: string;
  count: number;
}

export interface CampaignAnalyticsItem {
  shop: string;
  campaigns: string[];
  metrics: CampaignEngagementMetrics;
  segments: SegmentActivityMetric[];
  engagedContacts: number;
}

export interface MarketingSummary {
  totalCampaigns: number;
  totalSegments: number;
  sent: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  engagedContacts: number;
  segmentSignals: number;
  topSegment?: SegmentActivityMetric;
}

interface MarketingOverviewProps {
  analytics: CampaignAnalyticsItem[];
  summary: MarketingSummary;
}

function formatPercent(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

const marketingTools = [
  {
    title: "Email automations",
    description:
      "Design campaign flows, apply templates, and preview content before scheduling delivery.",
    helper:
      "Use segments to personalise copy and automatically include unsubscribe links in every send.",
    actionLabel: "Open email composer",
    href: "/cms/marketing/email",
  },
  {
    title: "Discount programs",
    description:
      "Create stackable codes, toggle availability, and monitor redemptions directly from analytics.",
    helper:
      "Codes sync to storefront checkout within a minute and respect scheduling windows by default.",
    actionLabel: "Manage discounts",
    href: "/cms/marketing/discounts",
  },
  {
    title: "Audience segments",
    description:
      "Group customers by behaviour, channel, or metadata and reuse segments across campaigns.",
    helper:
      "Segments update nightly from analytics events and can be previewed from the dashboard view.",
    actionLabel: "Build segments",
    href: "/cms/segments",
  },
];

export function MarketingOverview({ analytics, summary }: MarketingOverviewProps) {
  const openRatePercent = summary.sent > 0 ? (summary.opened / summary.sent) * 100 : 0;
  const clickRatePercent = summary.sent > 0 ? (summary.clicked / summary.sent) * 100 : 0;
  const topSegmentShare =
    summary.topSegment && summary.segmentSignals > 0
      ? (summary.topSegment.count / summary.segmentSignals) * 100
      : 0;
  const campaignsLabel =
    summary.totalCampaigns === 1
      ? "1 campaign"
      : `${summary.totalCampaigns.toLocaleString()} campaigns`;
  const segmentsLabel =
    summary.totalSegments === 1
      ? "1 segment"
      : `${summary.totalSegments.toLocaleString()} segments`;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Marketing workspace</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Launch campaigns, manage incentives, and keep sales aligned with the latest customer signals.
          Start with a guided tool and revisit recent activity across shops.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyticsSummaryCard
          title="Campaign engagement"
          status={{
            label: summary.sent > 0 ? "Active" : "Idle",
            tone: summary.sent > 0 ? "success" : "default",
          }}
          description="High-level performance from recent email campaigns across all shops."
          metrics={[
            {
              label: "Emails sent",
              value: summary.sent.toLocaleString(),
              helper:
                summary.sent > 0
                  ? `${campaignsLabel} delivered ${summary.sent.toLocaleString()} messages.`
                  : "Queue a campaign to start collecting engagement data.",
              badge:
                summary.unsubscribed > 0
                  ? {
                      label: `${summary.unsubscribed.toLocaleString()} unsubscribed`,
                      tone: "destructive",
                    }
                  : undefined,
            },
            {
              label: "Open rate",
              value: `${formatPercent(Math.max(0, Math.min(100, openRatePercent)))}%`,
              progress: {
                value: openRatePercent,
                label: `${summary.opened.toLocaleString()} opens`,
              },
              helper:
                summary.sent > 0
                  ? undefined
                  : "Open rates appear once campaigns finish sending.",
            },
            {
              label: "Click rate",
              value: `${formatPercent(Math.max(0, Math.min(100, clickRatePercent)))}%`,
              progress: {
                value: clickRatePercent,
                label: `${summary.clicked.toLocaleString()} clicks`,
              },
              helper:
                summary.sent > 0
                  ? undefined
                  : "Click rates appear once recipients interact with a campaign.",
            },
            {
              label: "Engaged contacts",
              value: summary.engagedContacts.toLocaleString(),
              helper:
                summary.engagedContacts > 0
                  ? "Unique recipients who opened or clicked a campaign."
                  : "Engagement numbers update after the first send.",
            },
          ]}
        />
        <AnalyticsSummaryCard
          title="Audience segments"
          status={{
            label: summary.totalSegments > 0 ? "Segments active" : "No segments",
            tone: summary.totalSegments > 0 ? "success" : "default",
          }}
          description="Monitor how analytics signals populate saved segments before targeting campaigns."
          metrics={[
            {
              label: "Active segments",
              value: summary.totalSegments.toLocaleString(),
              helper:
                summary.totalSegments > 0
                  ? `${segmentsLabel} available to target from the composer.`
                  : "Create a segment to group customers by shared behaviour.",
              badge:
                summary.engagedContacts > 0
                  ? {
                      label: `${summary.engagedContacts.toLocaleString()} engaged contacts`,
                      tone: "success",
                    }
                  : undefined,
            },
            {
              label: "Segment signals",
              value: summary.segmentSignals.toLocaleString(),
              helper:
                summary.segmentSignals > 0
                  ? "Recent events matched segment rules."
                  : "No events have been attributed to segments yet.",
            },
            {
              label: "Top segment",
              value: summary.topSegment ? summary.topSegment.id : "—",
              helper:
                summary.topSegment
                  ? `${summary.topSegment.count.toLocaleString()} matching events`
                  : "Signals appear once contacts meet segment conditions.",
              progress:
                summary.topSegment && summary.segmentSignals > 0
                  ? {
                      value: topSegmentShare,
                      label: `${formatPercent(Math.max(0, Math.min(100, topSegmentShare)))}% of segment signals`,
                    }
                  : undefined,
            },
            {
              label: "Unique campaigns",
              value: summary.totalCampaigns.toLocaleString(),
              helper:
                summary.totalCampaigns > 0
                  ? "Campaigns tracked across all shops."
                  : "Campaign data updates once analytics events are recorded.",
            },
          ]}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {marketingTools.map((tool) => (
          <Card key={tool.title}>
            <CardContent className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-foreground">{tool.title}</h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
              <div className="space-y-3">
                <Button asChild className="w-full justify-center">
                  <Link href={tool.href}>{tool.actionLabel}</Link>
                </Button>
                <p className="text-xs text-muted-foreground">{tool.helper}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {analytics.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent campaign performance</h2>
            <p className="text-sm text-muted-foreground">
              Jump into a shop dashboard to review opens, clicks, and downstream orders for each campaign.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {analytics.map((item) => {
              const shopOpenRate = item.metrics.sent > 0 ? (item.metrics.opened / item.metrics.sent) * 100 : 0;
              const shopClickRate = item.metrics.sent > 0 ? (item.metrics.clicked / item.metrics.sent) * 100 : 0;

              return (
                <Card key={item.shop}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{item.shop}</h3>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            {item.campaigns.length} active
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Tag variant="success" className="text-xs">
                            Open {formatPercent(Math.max(0, Math.min(100, shopOpenRate)))}%
                          </Tag>
                          <Tag variant="default" className="text-xs">
                            Click {formatPercent(Math.max(0, Math.min(100, shopClickRate)))}%
                          </Tag>
                          {item.metrics.unsubscribed > 0 && (
                            <Tag variant="destructive" className="text-xs">
                              {item.metrics.unsubscribed.toLocaleString()} unsubscribed
                            </Tag>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.engagedContacts > 0
                          ? `${item.engagedContacts.toLocaleString()} engaged contacts`
                          : "No engagement recorded yet."}
                      </p>
                    </div>

                    <ul className="space-y-2 text-sm">
                      {item.campaigns.map((campaign) => (
                        <li key={campaign}>
                          <Link
                            href={`/cms/dashboard/${item.shop}?campaign=${encodeURIComponent(
                              campaign,
                            )}`}
                            className="text-primary underline decoration-dotted underline-offset-4"
                          >
                            {campaign}
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {item.segments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Active segments
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.segments.slice(0, 4).map((segment) => (
                            <Tag key={segment.id} variant="default" className="text-[0.65rem]">
                              {segment.id} · {segment.count.toLocaleString()}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default MarketingOverview;
