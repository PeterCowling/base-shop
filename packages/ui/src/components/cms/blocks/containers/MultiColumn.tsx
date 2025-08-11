"use client";
import type { ReactNode } from "react";
import { cn } from "../../../../utils/style";

export interface MultiColumnProps {
  children?: ReactNode;
  /** Number of columns in the grid */
  columns?: number;
  /** Gap between columns/rows (any CSS length) */
  gap?: string;
  className?: string;
}

export default function MultiColumn({
  children,
  columns = 2,
  gap = "1rem",
  className,
}: MultiColumnProps) {
  return (
    <div
      className={cn("grid", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      {children}
    </div>
  );
}
