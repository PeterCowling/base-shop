import * as React from "react";
import type { Product } from "../organisms/ProductCard";
export interface SearchResultsTemplateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
    suggestions: string[];
    results: Product[];
    page: number;
    pageCount: number;
    onQueryChange?: (query: string) => void;
    onPageChange?: (page: number) => void;
}
export declare function SearchResultsTemplate({ suggestions, results, page, pageCount, onQueryChange, onPageChange, className, ...props }: SearchResultsTemplateProps): React.JSX.Element;
