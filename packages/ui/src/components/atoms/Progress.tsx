"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: React.ReactNode;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, label, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        <div className="bg-muted h-2 w-full overflow-hidden rounded" data-token="--color-muted">
          <div
            className="bg-primary h-full transition-all"
            style={{ width: `${value}%` }}
            data-token="--color-primary"
          />
        </div>
        {label ? (
          <div className="text-muted-foreground text-right text-sm" data-token="--color-muted-fg">
            {label}
          </div>
        ) : null}
      </div>
    );
  }
);
Progress.displayName = "Progress";
