import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  Progress,
  Tag,
  type TagProps,
} from "@acme/ui";
import { cn } from "@ui/utils/style";

interface MarketingMetricCardProps {
  title: string;
  value?: ReactNode;
  description?: ReactNode;
  tag?: { label: string; variant?: TagProps["variant"]; className?: string };
  progress?: { value: number; label?: ReactNode };
  loading?: boolean;
  emptyLabel?: ReactNode;
  className?: string;
}

export function MarketingMetricCard({
  title,
  value,
  description,
  tag,
  progress,
  loading = false,
  emptyLabel = "No data yet",
  className,
}: MarketingMetricCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {tag ? (
            <Tag
              variant={tag.variant ?? "default"}
              className={cn("text-xs font-medium", tag.className)}
            >
              {tag.label}
            </Tag>
          ) : null}
        </div>
        <div className="min-h-[2rem] text-2xl font-semibold">
          {loading ? (
            <span
              className="block h-6 w-24 animate-pulse rounded bg-muted"
              aria-hidden
            />
          ) : value !== undefined ? (
            value
          ) : (
            <span className="text-sm text-muted-foreground">{emptyLabel}</span>
          )}
        </div>
        {progress ? (
          <Progress
            value={Math.max(0, Math.min(100, Number.isFinite(progress.value) ? progress.value : 0))}
            label={progress.label}
          />
        ) : null}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
