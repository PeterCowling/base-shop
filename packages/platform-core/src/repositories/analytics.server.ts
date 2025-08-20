import type { AnalyticsAggregates, AnalyticsEvent } from "../analytics";

export async function listEvents(_shop: string): Promise<AnalyticsEvent[]> {
  return [];
}

export async function readAggregates(
  _shop: string,
): Promise<AnalyticsAggregates> {
  return {
    page_view: {},
    order: {},
    discount_redeemed: {},
    ai_crawl: {},
  };
}

