import type { AnalyticsSummaryCardProps } from "@acme/cms-ui/marketing/shared/AnalyticsSummaryCard";
import { AnalyticsSummaryCard } from "@acme/cms-ui/marketing/shared/AnalyticsSummaryCard";
import { Grid } from "@acme/design-system/primitives";

export interface MarketingSummaryCardsProps {
  cards: AnalyticsSummaryCardProps[];
}

export function MarketingSummaryCards({ cards }: MarketingSummaryCardsProps) {
  return (
    <section>
      <Grid gap={4} className="lg:grid-cols-2">
        {cards.map((card) => (
          <AnalyticsSummaryCard key={card.title} {...card} />
        ))}
      </Grid>
    </section>
  );
}

export default MarketingSummaryCards;
