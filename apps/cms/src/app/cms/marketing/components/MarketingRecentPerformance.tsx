import Link from "next/link";
import { Card, CardContent, Tag } from "@ui/components/atoms";
import type { MarketingRecentPerformanceItem } from "./useMarketingOverview";

export interface MarketingRecentPerformanceProps {
  items: MarketingRecentPerformanceItem[];
}

export function MarketingRecentPerformance({ items }: MarketingRecentPerformanceProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Recent campaign performance</h2>
        <p className="text-sm text-muted-foreground">
          Jump into a shop dashboard to review opens, clicks, and downstream orders for each campaign.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.shop}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{item.shop}</h3>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.activeLabel}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Tag variant={item.openRateTag.variant} className="text-xs">
                      {item.openRateTag.label}
                    </Tag>
                    <Tag variant={item.clickRateTag.variant} className="text-xs">
                      {item.clickRateTag.label}
                    </Tag>
                    {item.unsubscribedTag && (
                      <Tag variant={item.unsubscribedTag.variant} className="text-xs">
                        {item.unsubscribedTag.label}
                      </Tag>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{item.engagedContactsMessage}</p>
              </div>

              <ul className="space-y-2 text-sm">
                {item.campaigns.map((campaign) => (
                  <li key={campaign.name}>
                    <Link
                      href={campaign.href}
                      className="text-primary underline decoration-dotted underline-offset-4"
                    >
                      {campaign.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {item.segments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Active segments
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.segments.map((segment) => (
                      <Tag key={segment.id} variant="default" className="text-[0.65rem]">
                        {segment.label}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default MarketingRecentPerformance;
