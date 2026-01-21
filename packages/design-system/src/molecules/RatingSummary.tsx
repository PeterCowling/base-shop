import * as React from "react";

import { useTranslations } from "@acme/i18n";

import { cn } from "../utils/style";
import { RatingStars } from "../atoms/RatingStars";

export interface RatingSummaryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  rating: number; // 0-5 average rating
  count?: number; // optional number of reviews
}

/**
 * Display average rating and optional review count.
 */
export const RatingSummary = React.forwardRef<
  HTMLDivElement,
  RatingSummaryProps
>(({ rating, count, className, ...props }, ref) => {
  const t = useTranslations();
  const rounded = rating.toFixed(1);
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */ className)}
      {...props}
    >
      <RatingStars rating={rating} />
      <span className="text-sm">
        {rounded}
        {typeof count === "number" && (
          <span className="text-muted">
            {(() => {
              const formatted = (t as unknown as (key: string, params?: Record<string, unknown>) => string)(
                "ratings.count",
                { count }
              );
              // Fallback to simple count in parentheses when i18n is not configured
              return formatted && formatted !== "ratings.count" ? formatted : `(${count})`;
            })()}
          </span>
        )}
      </span>
    </div>
  );
});
RatingSummary.displayName = "RatingSummary";
