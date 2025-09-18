import Link from "next/link";
import { Button, Card, CardContent } from "@ui/components/atoms";
import type { MarketingTool } from "../lib/marketingOverview";

export interface MarketingToolsGridProps {
  tools: MarketingTool[];
}

export function MarketingToolsGrid({ tools }: MarketingToolsGridProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
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
  );
}

export default MarketingToolsGrid;
