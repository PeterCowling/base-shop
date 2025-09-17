import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  Progress,
  Skeleton,
  Tag,
  type TagProps,
} from "../../../atoms";
import { cn } from "../../../../utils/style";

export interface AnalyticsSummaryMetric {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  badge?: { label: ReactNode; tone?: TagProps["variant"]; };
  progress?: { value: number; label?: ReactNode };
}

export interface AnalyticsSummaryCardProps {
  title: string;
  description?: ReactNode;
  status?: { label: ReactNode; tone?: TagProps["variant"]; icon?: ReactNode };
  metrics: AnalyticsSummaryMetric[];
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  className?: string;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function AnalyticsSummaryCard({
  title,
  description,
  status,
  metrics,
  actions,
  footer,
  loading = false,
  className,
}: AnalyticsSummaryCardProps) {
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

        <dl className="grid gap-4 sm:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                {metric.label}
              </dt>
              <dd className="space-y-2">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </>
                ) : (
                  <>
                    <div className="text-xl font-semibold leading-tight">
                      {metric.value}
                    </div>
                    {metric.progress && (
                      <Progress
                        value={clampPercent(metric.progress.value)}
                        label={metric.progress.label}
                      />
                    )}
                  </>
                )}
                {!loading && metric.helper && (
                  <p className="text-muted-foreground text-xs">{metric.helper}</p>
                )}
                {!loading && metric.badge && (
                  <Tag variant={metric.badge.tone ?? "default"} className="text-[0.65rem]">
                    {metric.badge.label}
                  </Tag>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {footer && <div>{footer}</div>}
      </CardContent>
    </Card>
  );
}

export default AnalyticsSummaryCard;
