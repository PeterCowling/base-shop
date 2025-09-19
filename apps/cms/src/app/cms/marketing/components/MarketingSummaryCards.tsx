import { AnalyticsSummaryCard } from "@ui/components/cms/marketing/shared/AnalyticsSummaryCard";
import type { AnalyticsSummaryCardProps } from "@ui/components/cms/marketing/shared/AnalyticsSummaryCard";

export interface MarketingSummaryCardsProps {
  cards: AnalyticsSummaryCardProps[];
}

export function MarketingSummaryCards({ cards }: MarketingSummaryCardsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => (
        <AnalyticsSummaryCard key={card.title} {...card} />
      ))}
    </section>
  );
}

export default MarketingSummaryCards;
