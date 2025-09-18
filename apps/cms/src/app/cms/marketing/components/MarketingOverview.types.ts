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
