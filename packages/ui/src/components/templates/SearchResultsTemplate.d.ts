import * as React from "react";
import type { SKU } from "@acme/types";
export interface SearchResultsTemplateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "results"> {
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
export declare function SearchResultsTemplate({ suggestions, results, page, pageCount, minItems, maxItems, query, onQueryChange, onPageChange, filters, isLoading, className, ...props }: SearchResultsTemplateProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchResultsTemplate.d.ts.map