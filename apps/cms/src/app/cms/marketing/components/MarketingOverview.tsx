import Link from "next/link";
import { Button, Card, CardContent } from "@ui/components/atoms";

export interface CampaignAnalyticsItem {
  shop: string;
  campaigns: string[];
}

interface MarketingOverviewProps {
  analytics: CampaignAnalyticsItem[];
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

export function MarketingOverview({ analytics }: MarketingOverviewProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Marketing workspace</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Launch campaigns, manage incentives, and keep sales aligned with the latest customer signals.
          Start with a guided tool and revisit recent activity across shops.
        </p>
      </header>

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
            {analytics.map((item) => (
              <Card key={item.shop}>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">{item.shop}</h3>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.campaigns.length} active
                    </span>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default MarketingOverview;
