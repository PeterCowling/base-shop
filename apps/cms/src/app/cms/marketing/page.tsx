import Link from "next/link";
import { listShops } from "../listShops";
import { listEvents } from "@platform-core/repositories/analytics.server";

export default async function MarketingPage() {
  const shops = await listShops();
  const shopCampaigns = await Promise.all(
    shops.map(async (shop) => {
      const events = await listEvents(shop);
      const campaigns = Array.from(
        new Set(
          events
            .map((e) => (typeof e.campaign === "string" ? e.campaign : null))
            .filter(Boolean) as string[],
        ),
      );
      return { shop, campaigns };
    }),
  );

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
      {shopCampaigns.map(({ shop, campaigns }) => (
        <div key={shop} className="mt-4">
          <h3 className="font-semibold">{shop} campaigns</h3>
          <ul className="list-disc pl-6 space-y-1">
            {campaigns.map((c) => (
              <li key={c}>
                <Link href={`/cms/dashboard/${shop}?campaign=${encodeURIComponent(c)}`}>
                  {c}
                </Link>
              </li>
            ))}
            {campaigns.length === 0 && <li>No campaigns</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}
