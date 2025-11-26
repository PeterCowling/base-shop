"use client";

import * as React from "react";
import { cn } from "../../utils/style";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  label?: React.ReactNode;
  labelClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, label, className, labelClassName, style: _style, ...props }, ref) => {
    const clampedValue = Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : 0;
    const width = `${clampedValue}%`;

    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        <div
          className={
            "bg-muted h-2 w-full overflow-hidden rounded" // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
          }
          data-token="--color-muted" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
        >
          <div
            className={cn(
              "bg-primary h-full transition-all", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
              `w-[${width}]`
            )}
            data-token="--color-primary" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
          />
        </div>
        {label ? (
          <div
            className={cn(
              "text-muted-foreground text-end text-sm", // i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31]
              labelClassName
            )}
            data-token="--color-muted-fg" // i18n-exempt -- UI-000: design token attribute, not user copy [ttl=2026-01-31]
          >
            {label}
          </div>
        ) : null}
      </div>
    );
  }
);
Progress.displayName = "Progress"; // i18n-exempt -- UI-000: component displayName, not user-facing [ttl=2026-01-31]
