import * as React from "react";
import { cn } from "../../utils/style";
import { StatCard } from "../atoms/StatCard";

export interface StatItem {
  label: string;
  value: React.ReactNode;
}

export interface StatsGridProps extends React.HTMLAttributes<HTMLDivElement> {
  items: StatItem[];
}

export function StatsGrid({ items, className, ...props }: StatsGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        className,
      )}
      {...props}
    >
      {items.map(({ label, value }) => (
        <StatCard key={label} label={label} value={value} />
      ))}
    </div>
  );
}
