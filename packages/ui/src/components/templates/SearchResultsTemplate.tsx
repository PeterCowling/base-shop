import * as React from "react";
const t = (s: string) => s;
import { cn } from "../../utils/style";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import type { SKU } from "@acme/types";
import { ProductGrid } from "../organisms/ProductGrid";
import { Skeleton } from "../atoms/Skeleton";

export interface SearchResultsTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  suggestions: string[];
  results: SKU[];
  page: number;
  pageCount: number;
  /** Minimum items to show */
  minItems?: number;
  /** Maximum items to show */
  maxItems?: number;
  /** Optional search query to display */
  query?: string;
  onQueryChange?: (query: string) => void;
  onPageChange?: (page: number) => void;
  /** Optional filters to render between the search bar and results */
  filters?: React.ReactNode;
  /** Show loading state */
  isLoading?: boolean;
}

export function SearchResultsTemplate({
  suggestions,
  results,
  page,
  pageCount,
  minItems,
  maxItems,
  query,
  onQueryChange,
  onPageChange,
  filters,
  isLoading,
  className,
  ...props
}: SearchResultsTemplateProps) {
  const rawCount = maxItems ?? minItems ?? 1;
  const columnCount =
    Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1;
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <SearchBar
        query={query}
        suggestions={suggestions}
        onSelect={onQueryChange}
        onSearch={onQueryChange}
        placeholder={t("Search products…")}
        label={t("Search products")}
      />
      {filters}
      {isLoading ? (
        <div
          data-cy="search-results-loading"
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <ProductGrid
          products={results}
          minItems={minItems}
          maxItems={maxItems}
        />
      ) : (
        <p>{t("No results found.")}</p>
      )}
      {pageCount > 1 && (
        <PaginationControl
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
