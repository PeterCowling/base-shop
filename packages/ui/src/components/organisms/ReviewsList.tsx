"use client"; // i18n-exempt: Next.js directive string, not user-facing copy
import * as React from "react";
import { cn } from "../../utils/style";
import { RatingStars } from "../atoms/RatingStars";
import { Input } from "../atoms/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/primitives/select";
import { useTranslations } from "@acme/i18n";

export interface Review {
  author: string;
  rating: number; // 0-5
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
export function ReviewsList({
  reviews,
  minRating = 0,
  query = "",
  filterable = false,
  onMinRatingChange,
  onQueryChange,
  className,
  ...props
}: ReviewsListProps) {
  const t = useTranslations();
  const [localRating, setLocalRating] = React.useState(minRating);
  const [localQuery, setLocalQuery] = React.useState(query);

  const rating = onMinRatingChange ? minRating : localRating;
  const search = onQueryChange ? query : localQuery;

  const handleRatingChange = (v: number) => {
    if (onMinRatingChange) {
      onMinRatingChange(v);
    } else {
      setLocalRating(v);
    }
  };

  const handleQueryChange = (v: string) => {
    if (onQueryChange) {
      onQueryChange(v);
    } else {
      setLocalQuery(v);
    }
  };

  const normalized = search.trim().toLowerCase();
  const filtered = reviews.filter((r) => {
    const matchesRating = rating === 0 || r.rating >= rating;
    const matchesQuery =
      normalized.length === 0 ||
      r.author.toLowerCase().includes(normalized) ||
      r.content.toLowerCase().includes(normalized);
    return matchesRating && matchesQuery;
  });

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {filterable && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder={t("reviews.searchPlaceholder") as string}
            value={search}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-48"
          />
          <Select
            value={String(rating)}
            onValueChange={(v) => handleRatingChange(Number(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("reviews.rating") as string} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t("reviews.filter.all") as string}</SelectItem>
              <SelectItem value="5">{t("reviews.filter.5stars") as string}</SelectItem>
              <SelectItem value="4">{t("reviews.filter.4up") as string}</SelectItem>
              <SelectItem value="3">{t("reviews.filter.3up") as string}</SelectItem>
              <SelectItem value="2">{t("reviews.filter.2up") as string}</SelectItem>
              <SelectItem value="1">{t("reviews.filter.1up") as string}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("reviews.none") as string}</p>
      ) : (
        filtered.map((r) => (
          <div
            key={`${r.author}-${r.rating}-${r.content.slice(0, 50)}`}
            className="rounded-md border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{r.author}</span>
              <RatingStars rating={r.rating} />
            </div>
            <p className="mt-2 text-sm">{r.content}</p>
          </div>
        ))
      )}
    </div>
  );
}
