import * as React from "react";
import { cn } from "../../utils/style";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import type { Product } from "../organisms/ProductCard";
import { ProductGrid } from "../organisms/ProductGrid";
import { Skeleton } from "../atoms/Skeleton";

export interface SearchResultsTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  suggestions: string[];
  results: Product[];
  page: number;
  pageCount: number;
  /** Minimum items to show */
  minItems?: number;
  /** Maximum items to show */
  maxItems?: number;
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
  onQueryChange,
  onPageChange,
  filters,
  isLoading,
  className,
  ...props
}: SearchResultsTemplateProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <SearchBar
        suggestions={suggestions}
        onSelect={onQueryChange}
        onSearch={onQueryChange}
        placeholder="Search products…"
        label="Search products"
      />
      {filters}
      {isLoading ? (
        <div
          data-testid="search-results-loading"
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${maxItems ?? minItems ?? 1}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: maxItems ?? minItems ?? 1 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <ProductGrid products={results} minItems={minItems} maxItems={maxItems} />
      ) : (
        <p>No results found.</p>
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
