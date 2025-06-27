import * as React from "react";
import { cn } from "../../utils/cn";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import type { Product } from "../organisms/ProductCard";
import { ProductGrid } from "../organisms/ProductGrid";

export interface SearchResultsTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
  query: string;
  suggestions: string[];
  results: Product[];
  page: number;
  pageCount: number;
  onQueryChange?: (query: string) => void;
  onPageChange?: (page: number) => void;
}

export function SearchResultsTemplate({
  query,
  suggestions,
  results,
  page,
  pageCount,
  onQueryChange,
  onPageChange,
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
        <ProductGrid products={results} />
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
