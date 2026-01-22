import type { ReactNode } from "react";

import { Grid, Inline, Stack } from "@acme/design-system/primitives";
import { Card, CardContent, Tag, type TagProps } from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";

export interface SummaryMetricBadge {
  label: string;
  tone?: TagProps["variant"];
}

export interface SummaryMetric {
  label: string;
  value: ReactNode;
  badge?: SummaryMetricBadge;
  hint?: string;
}

export interface SummaryCardProps {
  title: string;
  description?: string;
  status?: {
    label: string;
    tone?: TagProps["variant"];
    icon?: ReactNode;
  };
  metrics?: SummaryMetric[];
  footer?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SummaryCard({
  title,
  description,
  status,
  metrics,
  footer,
  actions,
  className,
}: SummaryCardProps) {
  return (
    <Card className={cn("space-y-4", className)}>
      <CardContent className="space-y-4">
        <Inline className="items-start justify-between gap-3">
          <Stack className="space-y-2">
            <Inline className="items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {status && (
                <Tag variant={status.tone ?? "default"}>
                  <Inline className="items-center gap-1">
                    {status.icon}
                    {status.label}
                  </Inline>
                </Tag>
              )}
            </Inline>
            {description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            )}
          </Stack>
          {actions && <Inline className="items-center gap-2">{actions}</Inline>}
        </Inline>
        {metrics && metrics.length > 0 && (
          <Grid cols={1} gap={4} className="sm:grid-cols-2">
            {metrics.map(({ label, value, badge, hint }) => (
              <div key={label} className="space-y-1">
                <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                  {label}
                </dt>
                <dd className="text-base font-medium">
                  {typeof value === "string" || typeof value === "number" ? (
                    <span>{value}</span>
                  ) : (
                    value
                  )}
                </dd>
                {hint && (
                  <p className="text-muted-foreground text-xs">{hint}</p>
                )}
                {badge && (
                  <Tag variant={badge.tone ?? "default"} className="text-xs">
                    {badge.label}
                  </Tag>
                )}
              </div>
            ))}
          </Grid>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
