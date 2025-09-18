import { MarketingOverviewHero } from "./MarketingOverviewHero";
import { MarketingRecentPerformance } from "./MarketingRecentPerformance";
import { MarketingSummaryCards } from "./MarketingSummaryCards";
import { MarketingToolsGrid } from "./MarketingToolsGrid";
import {
  useMarketingOverview,
  type UseMarketingOverviewResult,
} from "./useMarketingOverview";
import type {
  CampaignAnalyticsItem,
  MarketingSummary,
} from "./MarketingOverview.types";

export interface MarketingOverviewProps {
  analytics: CampaignAnalyticsItem[];
  summary: MarketingSummary;
}

export function MarketingOverview({ analytics, summary }: MarketingOverviewProps) {
  const { summaryCards, tools, recentPerformance, showRecentPerformance }: UseMarketingOverviewResult =
    useMarketingOverview({ analytics, summary });

  return (
    <div className="space-y-6">
      <MarketingOverviewHero />
      <MarketingSummaryCards cards={summaryCards} />
      <MarketingToolsGrid tools={tools} />
      {showRecentPerformance && <MarketingRecentPerformance items={recentPerformance} />}
    </div>
  );
}

export type {
  CampaignAnalyticsItem,
  CampaignEngagementMetrics,
  MarketingSummary,
  SegmentActivityMetric,
} from "./MarketingOverview.types";

export default MarketingOverview;
