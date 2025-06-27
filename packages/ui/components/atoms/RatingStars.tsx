import * as React from "react";
import { cn } from "../../utils/cn";

export interface RatingStarsProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number; // 0-5
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={filled ? "fill-yellow-500" : "fill-gray-300"}
      width={16}
      height={16}
    >
      <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.4 8.173L12 18.902l-7.334 3.868 1.4-8.173L.132 9.211l8.2-1.193z" />
    </svg>
  );
}

export const RatingStars = React.forwardRef<HTMLDivElement, RatingStarsProps>(
  ({ rating, className, ...props }, ref) => {
    const rounded = Math.round(rating);
    return (
      <div ref={ref} className={cn("flex gap-0.5", className)} {...props}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < rounded} />
        ))}
      </div>
    );
  }
);
RatingStars.displayName = "RatingStars";
