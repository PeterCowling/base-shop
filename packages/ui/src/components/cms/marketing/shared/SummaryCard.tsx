import type { ReactNode } from "react";
import { Card, CardContent, Tag, type TagProps } from "../../../atoms/shadcn";
import { cn } from "../../../../utils/style";

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {status && (
                <Tag variant={status.tone ?? "default"}>
                  <span className="flex items-center gap-1">
                    {status.icon}
                    {status.label}
                  </span>
                </Tag>
              )}
            </div>
            {description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {metrics && metrics.length > 0 && (
          <dl className="grid gap-4 sm:grid-cols-2">
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
                  <Tag variant={badge.tone ?? "default"} className="text-[0.65rem]">
                    {badge.label}
                  </Tag>
                )}
              </div>
            ))}
          </dl>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}
