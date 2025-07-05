import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../../utils/cn";
import { PaginationControl } from "../molecules/PaginationControl";
import { SearchBar } from "../molecules/SearchBar";
import { ProductGrid } from "../organisms/ProductGrid";
export function SearchResultsTemplate({ suggestions, results, page, pageCount, onQueryChange, onPageChange, className, ...props }) {
    return (_jsxs("div", { className: cn("space-y-6", className), ...props, children: [_jsx(SearchBar, { suggestions: suggestions, onSelect: onQueryChange, placeholder: "Search products\u2026" }), results.length > 0 ? (_jsx(ProductGrid, { products: results })) : (_jsx("p", { children: "No results found." })), pageCount > 1 && (_jsx(PaginationControl, { page: page, pageCount: pageCount, onPageChange: onPageChange }))] }));
}
