import * as React from "react";
import { cn } from "../../utils/style";
import type { Column } from "../organisms/DataTable";
import { DataTable } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { StatsGrid } from "../organisms/StatsGrid";

export interface LoyaltyProgress {
  current: number;
  goal: number;
  label?: string;
}

export interface LoyaltyHubTemplateProps<T>
  extends React.HTMLAttributes<HTMLDivElement> {
  stats: StatItem[];
  progress?: LoyaltyProgress;
  historyRows: T[];
  historyColumns: Column<T>[];
}

export function LoyaltyHubTemplate<T>({
  stats,
  progress,
  historyRows,
  historyColumns,
  className,
  ...props
}: LoyaltyHubTemplateProps<T>) {
  const percent = progress ? (progress.current / progress.goal) * 100 : 0;

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">Loyalty Hub</h2>
      <StatsGrid items={stats} />
      {progress && (
        <div className="space-y-1">
          {progress.label && (
            <span className="text-sm font-medium">{progress.label}</span>
          )}
          <div className="bg-muted h-2 w-full overflow-hidden rounded" data-token="--color-muted">
            <div
              className="bg-primary h-full"
              style={{ width: `${percent}%` }}
              data-token="--color-primary"
            />
          </div>
          <div className="text-muted-foreground text-sm" data-token="--color-muted">
            {progress.current}/{progress.goal} points
          </div>
        </div>
      )}
      <DataTable rows={historyRows} columns={historyColumns} />
    </div>
  );
}
