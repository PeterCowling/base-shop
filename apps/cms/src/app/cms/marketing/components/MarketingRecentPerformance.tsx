import Link from "next/link";
import { Card, CardContent, Tag } from "@acme/ui/components/atoms";
import { Grid, Inline, Cluster } from "@acme/ui/components/atoms/primitives";
import type { MarketingRecentPerformanceItem } from "./useMarketingOverview";
import { useTranslations } from "@acme/i18n";

export interface MarketingRecentPerformanceProps {
  items: MarketingRecentPerformanceItem[];
}

export function MarketingRecentPerformance({ items }: MarketingRecentPerformanceProps) {
  const t = useTranslations();
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("cms.marketing.recentPerformance.heading")}</h2>
        <p className="text-sm text-muted-foreground">{t("cms.marketing.recentPerformance.subheading")}</p>
      </div>
      <Grid gap={4} className="md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.shop}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Cluster gap={3} alignY="start" justify="between">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground">{item.shop}</h3>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {item.activeLabel}
                    </span>
                  </div>
                  <Inline gap={2} className="shrink-0">
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
                  </Inline>
                </Cluster>
                <p className="text-xs text-muted-foreground">{item.engagedContactsMessage}</p>
              </div>

              <ul className="space-y-2 text-sm">
                {item.campaigns.map((campaign) => (
                  <li key={campaign.name}>
                    <Link
                      href={campaign.href}
                      className="text-link underline decoration-dotted underline-offset-4"
                    >
                      {campaign.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {item.segments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("cms.marketing.recentPerformance.activeSegments")}
                  </h4>
                  <Inline gap={2}>
                    {item.segments.map((segment) => (
                      <Tag key={segment.id} variant="default" className="text-xs">
                        {segment.label}
                      </Tag>
                    ))}
                  </Inline>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </Grid>
    </section>
  );
}

export default MarketingRecentPerformance;
