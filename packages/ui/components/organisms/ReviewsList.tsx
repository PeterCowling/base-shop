import * as React from "react";
import { cn } from "../../utils/cn";
import { RatingStars } from "../atoms/RatingStars";

export interface Review {
  author: string;
  rating: number; // 0-5
  content: string;
}

export interface ReviewsListProps extends React.HTMLAttributes<HTMLDivElement> {
  reviews: Review[];
}

/**
 * Display a list of product reviews with author and rating.
 */
export function ReviewsList({
  reviews,
  className,
  ...props
}: ReviewsListProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {reviews.map((r, i) => (
        <div key={i} className="rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{r.author}</span>
            <RatingStars rating={r.rating} />
          </div>
          <p className="mt-2 text-sm">{r.content}</p>
        </div>
      ))}
    </div>
  );
}
