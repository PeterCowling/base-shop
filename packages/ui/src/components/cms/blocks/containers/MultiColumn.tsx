"use client";
import type { CSSProperties, ReactNode } from "react";

export interface MultiColumnProps {
  children?: ReactNode;
  columns?: number;
  gap?: string;
  className?: string;
}

export default function MultiColumn({
  children,
  columns = 2,
  gap = "1rem",
  className,
}: MultiColumnProps) {
  const style: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap,
  };
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
