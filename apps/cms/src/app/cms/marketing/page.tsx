import type { AnalyticsEvent } from "@acme/platform-core/analytics";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";

import { listShops } from "../../../lib/listShops";

import MarketingOverview, {
  type CampaignAnalyticsItem,
  type MarketingSummary,
  type SegmentActivityMetric,
} from "./components/MarketingOverview";

function segmentIdFromEvent(event: AnalyticsEvent): string | null {
  if (typeof event.segment === "string" && event.segment.trim()) {
    return event.segment;
  }
  if (typeof event.type === "string" && event.type.startsWith("segment:")) {
    const id = event.type.slice("segment:".length).trim();
    return id ? id : null;
  }
  return null;
}

export default async function MarketingPage() {
  const shops = await listShops();
  const analytics: CampaignAnalyticsItem[] = [];
  const summaryAccumulator = {
    campaigns: new Set<string>(),
    segments: new Map<string, number>(),
    segmentSignals: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    engagedContacts: new Set<string>(),
  };

  for (const shop of shops) {
    const events: AnalyticsEvent[] = await listEvents(shop);
    const campaignSet = new Set<string>();
    const segmentCounts = new Map<string, number>();
    const shopEngaged = new Set<string>();
    let sent = 0;
    let opened = 0;
    let clicked = 0;
    let unsubscribed = 0;

    for (const event of events) {
      if (typeof event.campaign === "string") {
        campaignSet.add(event.campaign);
        summaryAccumulator.campaigns.add(`${shop}:${event.campaign}`);
      }

      switch (event.type) {
        case "email_sent":
          sent += 1;
          summaryAccumulator.sent += 1;
          break;
        case "email_open":
          opened += 1;
          summaryAccumulator.opened += 1;
          if (typeof event.email === "string") {
            shopEngaged.add(event.email);
            summaryAccumulator.engagedContacts.add(event.email);
          }
          break;
        case "email_click":
          clicked += 1;
          summaryAccumulator.clicked += 1;
          if (typeof event.email === "string") {
            shopEngaged.add(event.email);
            summaryAccumulator.engagedContacts.add(event.email);
          }
          break;
        case "email_unsubscribe":
          unsubscribed += 1;
          summaryAccumulator.unsubscribed += 1;
          break;
        default:
          break;
      }

      const segmentId = segmentIdFromEvent(event);
      if (segmentId) {
        segmentCounts.set(segmentId, (segmentCounts.get(segmentId) ?? 0) + 1);
        summaryAccumulator.segments.set(
          segmentId,
          (summaryAccumulator.segments.get(segmentId) ?? 0) + 1,
        );
        summaryAccumulator.segmentSignals += 1;
      }
    }

    if (campaignSet.size > 0) {
      const segments: SegmentActivityMetric[] = Array.from(segmentCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count);

      analytics.push({
        shop,
        campaigns: Array.from(campaignSet),
        metrics: { sent, opened, clicked, unsubscribed },
        segments,
        engagedContacts: shopEngaged.size,
      });
    }
  }

  let topSegment: SegmentActivityMetric | undefined;
  for (const [id, count] of summaryAccumulator.segments.entries()) {
    if (!topSegment || count > topSegment.count) {
      topSegment = { id, count };
    }
  }

  const summary: MarketingSummary = {
    totalCampaigns: summaryAccumulator.campaigns.size,
    totalSegments: summaryAccumulator.segments.size,
    sent: summaryAccumulator.sent,
    opened: summaryAccumulator.opened,
    clicked: summaryAccumulator.clicked,
    unsubscribed: summaryAccumulator.unsubscribed,
    engagedContacts: summaryAccumulator.engagedContacts.size,
    segmentSignals: summaryAccumulator.segmentSignals,
    topSegment,
  };

  return (
    <div className="p-6">
      <MarketingOverview analytics={analytics} summary={summary} />
    </div>
  );
}
