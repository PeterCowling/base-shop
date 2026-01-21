import { Grid } from "@acme/ui/components/atoms/primitives";

import { Card, CardContent } from "@/components/atoms/shadcn";

export interface TelemetrySummaryMetric {
  label: string;
  value: number | string;
  description: string;
}

interface TelemetrySummaryCardsProps {
  metrics: TelemetrySummaryMetric[];
}

export function TelemetrySummaryCards({
  metrics,
}: TelemetrySummaryCardsProps) {
  return (
    <Grid cols={1} gap={3} className="sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="border border-border/10 bg-surface-2 text-foreground"
        >
          <CardContent className="space-y-1 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {metric.label}
            </p>
            <p className="text-2xl font-semibold">{metric.value}</p>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </Grid>
  );
}
