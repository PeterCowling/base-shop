import type { AnalyticsEvent } from "@acme/platform-core/analytics";
import { listEvents } from "@acme/platform-core/repositories/analytics.server";

import MarketingOverview, {
  type CampaignAnalyticsItem,
  type MarketingSummary,
  type SegmentActivityMetric,
} from "../../../../marketing/components/MarketingOverview";

import ShopEmailComposerClient from "./shop-email-composer.client";

export default async function ShopEmailMarketingPage({
  params,
}: {
  params: { shop: string };
}) {
  const shop = params.shop;

  // Build analytics for just this shop (server-side)
  const events: AnalyticsEvent[] = await listEvents(shop);
  const campaignSet = new Set<string>();
  const segmentCounts = new Map<string, number>();
  const engaged = new Set<string>();
  let sent = 0;
  let opened = 0;
  let clicked = 0;
  let unsubscribed = 0;

  for (const event of events) {
    if (typeof event.campaign === "string") {
      campaignSet.add(event.campaign);
    }
    switch (event.type) {
      case "email_sent":
        sent += 1;
        break;
      case "email_open":
        opened += 1;
        if (typeof event.email === "string") engaged.add(event.email);
        break;
      case "email_click":
        clicked += 1;
        if (typeof event.email === "string") engaged.add(event.email);
        break;
      case "email_unsubscribe":
        unsubscribed += 1;
        break;
      default:
        break;
    }
    // segment attribution
    const seg = (() => {
      if (typeof event.segment === "string" && event.segment.trim()) return event.segment;
      if (typeof event.type === "string" && event.type.startsWith("segment:")) {
        const id = event.type.slice("segment:".length).trim();
        return id || null;
      }
      return null;
    })();
    if (seg) segmentCounts.set(seg, (segmentCounts.get(seg) ?? 0) + 1);
  }

  const segments: SegmentActivityMetric[] = Array.from(segmentCounts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  const analytics: CampaignAnalyticsItem[] = campaignSet.size
    ? [
        {
          shop,
          campaigns: Array.from(campaignSet),
          metrics: { sent, opened, clicked, unsubscribed },
          segments,
          engagedContacts: engaged.size,
        },
      ]
    : [];

  let topSegment: SegmentActivityMetric | undefined;
  for (const [id, count] of segmentCounts.entries()) {
    if (!topSegment || count > topSegment.count) topSegment = { id, count };
  }

  const summary: MarketingSummary = {
    totalCampaigns: campaignSet.size,
    totalSegments: segmentCounts.size,
    sent,
    opened,
    clicked,
    unsubscribed,
    engagedContacts: engaged.size,
    segmentSignals: Array.from(segmentCounts.values()).reduce((s, n) => s + n, 0),
    topSegment,
  };

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Shop marketing overview</h2>
        <MarketingOverview analytics={analytics} summary={summary} />
      </section>
      <div className="h-px w-full bg-border" aria-hidden="true" />
      <ShopEmailComposerClient shop={shop} />
    </div>
  );
}
