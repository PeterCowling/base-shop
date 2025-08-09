import * as React from "react";
import { cn } from "../../utils/cn";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import type { Product } from "../organisms/ProductCard";
import { ProductGrid } from "../organisms/ProductGrid";

export interface SearchResultsTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  suggestions: string[];
  results: Product[];
  page: number;
  pageCount: number;
  onQueryChange?: (query: string) => void;
  onPageChange?: (page: number) => void;
  /** Minimum number of items required to render results */
  minItems?: number;
  /** Maximum number of items to render */
  maxItems?: number;
}

export function SearchResultsTemplate({
  suggestions,
  results,
  page,
  pageCount,
  onQueryChange,
  onPageChange,
  minItems,
  maxItems,
  className,
  ...props
}: SearchResultsTemplateProps) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      <SearchBar
        suggestions={suggestions}
        onSelect={onQueryChange}
        placeholder="Search products…"
      />
      {results.length > 0 ? (
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
