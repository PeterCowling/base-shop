import * as React from "react";
import { cn } from "../../utils/cn";
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
  const rounded = rating.toFixed(1);
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <RatingStars rating={rating} />
      <span className="text-sm">
        {rounded}
        {typeof count === "number" && (
          <span className="text-muted"> ({count})</span>
        )}
      </span>
    </div>
  );
});
RatingSummary.displayName = "RatingSummary";
