import * as React from "react";

import { useTranslations } from "@acme/i18n";
import type { SKU } from "@acme/types";

import { cn } from "../../utils/style";
import { Grid as GridPrimitive } from "../atoms/primitives";
import { Skeleton } from "../atoms/Skeleton";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import { ProductGrid } from "../organisms/ProductGrid";

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
  const t = useTranslations();
  const searchAriaLabel = t("shop.searchAriaLabel") as string;
  const rawCount = maxItems ?? minItems ?? 1;
  const columnCount =
    Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1;
  const skeletonKeys = React.useMemo(
    () => Array.from({ length: columnCount }, () => Math.random().toString(36).slice(2)),
    [columnCount]
  );
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <SearchBar
        query={query}
        suggestions={suggestions}
        onSelect={onQueryChange}
        onSearch={onQueryChange}
        placeholder={t("shop.searchPlaceholder") as string}
        label={searchAriaLabel}
      />
      {filters}
      {isLoading ? (
        <GridPrimitive
          /* i18n-exempt -- DS-0002 [ttl=2026-01-31] */
          data-cy="search-results-loading"
          cols={1}
          gap={6}
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columnCount }).map((_, i) => (
            <Skeleton key={skeletonKeys[i]} className="h-48 w-full" />
          ))}
        </GridPrimitive>
      ) : results.length > 0 ? (
        <ProductGrid
          products={results}
          minItems={minItems}
          maxItems={maxItems}
        />
      ) : (
        <p>{t("search.noResults") as string}</p>
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
