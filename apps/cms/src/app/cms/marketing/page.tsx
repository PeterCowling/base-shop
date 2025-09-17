import { listShops } from "../../../lib/listShops";
import { listEvents } from "@platform-core/repositories/analytics.server";
import type { AnalyticsEvent } from "@platform-core/analytics";
import MarketingOverview, {
  type CampaignAnalyticsItem,
} from "./components/MarketingOverview";

export default async function MarketingPage() {
  const shops = await listShops();
  const analytics: CampaignAnalyticsItem[] = [];
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
    if (campaigns.length > 0) {
      analytics.push({ shop, campaigns });
    }
  }

  return (
    <div className="p-6">
      <MarketingOverview analytics={analytics} />
    </div>
  );
}
