import * as React from "react";
import { cn } from "../../utils/style";
import type { Column } from "../organisms/DataTable";
import { DataTable } from "../organisms/DataTable";
import type { StatItem } from "../organisms/StatsGrid";
import { StatsGrid } from "../organisms/StatsGrid";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  // percent no longer needed after switching to semantic <progress>

  return (
    <div className={cn("space-y-6", className)} {...props}>
      <h2 className="text-xl font-semibold">{t("loyalty.hub.title")}</h2>
      <StatsGrid items={stats} />
      {progress && (
        <div className="space-y-1">
          {progress.label && (
            <span className="text-sm font-medium">{progress.label}</span>
          )}
          <progress
            className="h-2 w-full overflow-hidden rounded bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
            value={progress.current}
            max={progress.goal}
            aria-label={progress.label ?? (t("loyalty.progress.aria") as string)}
          />
          <div className="text-muted-foreground text-sm">
            {t("loyalty.progress.count", { current: progress.current, goal: progress.goal })}
          </div>
        </div>
      )}
      <DataTable rows={historyRows} columns={historyColumns} />
    </div>
  );
}
