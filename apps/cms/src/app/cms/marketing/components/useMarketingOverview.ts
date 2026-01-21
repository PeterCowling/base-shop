import { useMemo } from "react";

import type { AnalyticsSummaryCardProps } from "@acme/ui/components/cms/marketing";

import { clampPercent, formatPercent, type MarketingTool,marketingTools } from "../lib/marketingOverview";

import type {
  CampaignAnalyticsItem,
  MarketingSummary,
} from "./MarketingOverview.types";

type TagVariant = "default" | "success" | "warning" | "destructive";

export interface MarketingRecentPerformanceTag {
  label: string;
  variant: TagVariant;
}

export interface MarketingRecentPerformanceCampaign {
  name: string;
  href: string;
}

export interface MarketingRecentPerformanceSegment {
  id: string;
  label: string;
}

export interface MarketingRecentPerformanceItem {
  shop: string;
  activeLabel: string;
  openRateTag: MarketingRecentPerformanceTag;
  clickRateTag: MarketingRecentPerformanceTag;
  unsubscribedTag?: MarketingRecentPerformanceTag;
  engagedContactsMessage: string;
  campaigns: MarketingRecentPerformanceCampaign[];
  segments: MarketingRecentPerformanceSegment[];
}

interface UseMarketingOverviewProps {
  analytics: CampaignAnalyticsItem[];
  summary: MarketingSummary;
}

export interface UseMarketingOverviewResult {
  summaryCards: AnalyticsSummaryCardProps[];
  tools: MarketingTool[];
  recentPerformance: MarketingRecentPerformanceItem[];
  showRecentPerformance: boolean;
}

export function useMarketingOverview({
  analytics,
  summary,
}: UseMarketingOverviewProps): UseMarketingOverviewResult {
  const summaryCards = useMemo<AnalyticsSummaryCardProps[]>(() => {
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

    return [
      {
        title: "Campaign engagement",
        status: {
          label: summary.sent > 0 ? "Active" : "Idle",
          tone: summary.sent > 0 ? "success" : "default",
        },
        description: "High-level performance from recent email campaigns across all shops.",
        metrics: [
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
            value: `${formatPercent(clampPercent(openRatePercent))}%`,
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
            value: `${formatPercent(clampPercent(clickRatePercent))}%`,
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
        ],
      },
      {
        title: "Audience segments",
        status: {
          label: summary.totalSegments > 0 ? "Segments active" : "No segments",
          tone: summary.totalSegments > 0 ? "success" : "default",
        },
        description: "Monitor how analytics signals populate saved segments before targeting campaigns.",
        metrics: [
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
                    label: `${formatPercent(clampPercent(topSegmentShare))}% of segment signals`,
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
        ],
      },
    ];
  }, [summary]);

  const recentPerformance = useMemo<MarketingRecentPerformanceItem[]>(() => {
    return analytics.map((item) => {
      const openRate = item.metrics.sent > 0 ? (item.metrics.opened / item.metrics.sent) * 100 : 0;
      const clickRate = item.metrics.sent > 0 ? (item.metrics.clicked / item.metrics.sent) * 100 : 0;

      return {
        shop: item.shop,
        activeLabel: `${item.campaigns.length} active`,
        openRateTag: {
          label: `Open ${formatPercent(clampPercent(openRate))}%`,
          variant: "success",
        },
        clickRateTag: {
          label: `Click ${formatPercent(clampPercent(clickRate))}%`,
          variant: "default",
        },
        unsubscribedTag:
          item.metrics.unsubscribed > 0
            ? {
                label: `${item.metrics.unsubscribed.toLocaleString()} unsubscribed`,
                variant: "destructive",
              }
            : undefined,
        engagedContactsMessage:
          item.engagedContacts > 0
            ? `${item.engagedContacts.toLocaleString()} engaged contacts`
            : "No engagement recorded yet.",
        campaigns: item.campaigns.map((campaign) => ({
          name: campaign,
          href: `/cms/dashboard/${item.shop}?campaign=${encodeURIComponent(campaign)}`,
        })),
        segments: item.segments.slice(0, 4).map((segment) => ({
          id: segment.id,
          label: `${segment.id} · ${segment.count.toLocaleString()}`,
        })),
      };
    });
  }, [analytics]);

  return {
    summaryCards,
    tools: marketingTools,
    recentPerformance,
    showRecentPerformance: recentPerformance.length > 0,
  };
}
