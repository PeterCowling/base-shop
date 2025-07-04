import * as React from "react";
export interface Review {
    author: string;
    rating: number;
    content: string;
}
export interface ReviewsListProps extends React.HTMLAttributes<HTMLDivElement> {
    reviews: Review[];
    /** Minimum rating to display (1-5). Defaults to 0 which shows all. */
    minRating?: number;
    /** Text query to match against author or content. */
    query?: string;
    /** Display built-in filter controls */
    filterable?: boolean;
    /** Callback when the minimum rating changes */
    onMinRatingChange?: (v: number) => void;
    /** Callback when the search query changes */
    onQueryChange?: (v: string) => void;
}
/**
 * Display a list of product reviews with author and rating.
 */
export declare function ReviewsList({ reviews, minRating, query, filterable, onMinRatingChange, onQueryChange, className, ...props }: ReviewsListProps): React.JSX.Element;
