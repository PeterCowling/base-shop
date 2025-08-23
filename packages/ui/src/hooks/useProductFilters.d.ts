export type ProductStatus = "all" | "active" | "draft" | "archived";
export interface UseProductFiltersResult<T, S extends string = ProductStatus> {
    search: string;
    status: S | "all";
    setSearch: (v: string) => void;
    setStatus: (v: S | "all") => void;
    filteredRows: T[];
}
export declare function useProductFilters<T extends {
    title: string | Record<string, string>;
    sku?: string;
    status?: S;
}, S extends string = ProductStatus>(rows: readonly T[]): UseProductFiltersResult<T, S>;
//# sourceMappingURL=useProductFilters.d.ts.map