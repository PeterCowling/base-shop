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
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="border border-white/10 bg-slate-900/70 text-white"
        >
          <CardContent className="space-y-1 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-white/60">
              {metric.label}
            </p>
            <p className="text-2xl font-semibold">{metric.value}</p>
            <p className="text-xs text-white/60">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
