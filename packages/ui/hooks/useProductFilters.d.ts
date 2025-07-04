import type { ProductPublication } from "@platform-core/products";
export type ProductStatus = "all" | "active" | "draft" | "archived";
export interface UseProductFiltersResult {
    search: string;
    status: ProductStatus;
    setSearch: (v: string) => void;
    setStatus: (v: ProductStatus) => void;
    filteredRows: ProductPublication[];
}
export declare function useProductFilters(rows: ProductPublication[]): UseProductFiltersResult;
