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
        <div
          className={
            // i18n-exempt — CSS utility class names
            "bg-muted h-2 w-full overflow-hidden rounded"
          }
          // i18n-exempt — design token attribute, not user copy
          data-token="--color-muted"
        >
          <div
            className={
              // i18n-exempt — CSS utility class names
              "bg-primary h-full transition-all"
            }
            style={{ width: `${value}%` }}
            // i18n-exempt — design token attribute, not user copy
            data-token="--color-primary"
          />
        </div>
        {label ? (
          <div
            className={cn(
              "text-muted-foreground text-end text-sm", // i18n-exempt — CSS utility class names
              labelClassName
            )}
            // i18n-exempt — design token attribute, not user copy
            data-token="--color-muted-fg"
          >
            {label}
          </div>
        ) : null}
      </div>
    );
  }
);
Progress.displayName = "Progress"; // i18n-exempt — component displayName, not user-facing
