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
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", // i18n-exempt: CSS utility classes only
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
