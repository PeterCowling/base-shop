import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import { ProductGrid } from "../organisms/ProductGrid";
import { Skeleton } from "../atoms/Skeleton";
export function SearchResultsTemplate({ suggestions, results, page, pageCount, minItems, maxItems, query, onQueryChange, onPageChange, filters, isLoading, className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx(SearchBar, { query: query, suggestions: suggestions, onSelect: onQueryChange, onSearch: onQueryChange, placeholder: "Search products\u2026", label: "Search products" }), filters, isLoading ? (_jsx("div", { "data-testid": "search-results-loading", className: "grid gap-6", style: {
                    gridTemplateColumns: `repeat(${maxItems ?? minItems ?? 1}, minmax(0, 1fr))`,
                }, children: Array.from({ length: maxItems ?? minItems ?? 1 }).map((_, i) => (_jsx(Skeleton, { className: "h-48 w-full" }, i))) })) : results.length > 0 ? (_jsx(ProductGrid, { products: results, minItems: minItems, maxItems: maxItems })) : (_jsx("p", { children: "No results found." })), pageCount > 1 && (_jsx(PaginationControl, { page: page, pageCount: pageCount, onPageChange: onPageChange }))] }));
}
