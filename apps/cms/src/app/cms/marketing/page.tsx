import Link from "next/link";
import { listShops } from "../listShops";
import { listEvents } from "@platform-core/repositories/analytics.server";

export default async function MarketingPage() {
  const shops = await listShops();
  const campaignsByShop: Record<string, string[]> = {};
  for (const shop of shops) {
    const events = await listEvents(shop);
    const campaigns = Array.from(
      new Set(
        events
          .map((e) => (typeof e.campaign === "string" ? e.campaign : null))
          .filter(Boolean) as string[],
      ),
    );
    if (campaigns.length > 0) campaignsByShop[shop] = campaigns;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Marketing Tools</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link href="/cms/marketing/email">Email Campaign</Link>
        </li>
        <li>
          <Link href="/cms/marketing/discounts">Discount Codes</Link>
        </li>
      </ul>
      {Object.keys(campaignsByShop).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Campaign Analytics</h3>
          {Object.entries(campaignsByShop).map(([shop, campaigns]) => (
            <div key={shop}>
              <h4 className="font-medium">{shop}</h4>
              <ul className="list-disc pl-6">
                {campaigns.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/cms/dashboard/${shop}?campaign=${encodeURIComponent(
                        c,
                      )}`}
                      className="text-primary underline"
                    >
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
