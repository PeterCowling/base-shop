"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: React.ReactNode;
  labelClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, label, className, labelClassName, ...props }, ref) => {
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
          <div
            className={cn(
              "text-muted-foreground text-end text-sm",
              labelClassName
            )}
            data-token="--color-muted-fg"
          >
            {label}
          </div>
        ) : null}
      </div>
    );
  }
);
Progress.displayName = "Progress";
