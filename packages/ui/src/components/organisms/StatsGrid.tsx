import * as React from "react";
import { cn } from "../../utils/cn";
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
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
