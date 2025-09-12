import type { AnalyticsEvent } from "@platform-core/analytics";
export type ComparisonOp = "gt" | "lt" | "gte" | "lte" | "eq";
export interface FieldFilter {
    field: string;
    value: string;
    op?: ComparisonOp;
}
export interface AndFilter {
    and: Filter[];
}
export interface OrFilter {
    or: Filter[];
}
export type Filter = FieldFilter | AndFilter | OrFilter;
export interface SegmentDef {
    id: string;
    filters: Filter | Filter[];
}
export declare function matches(filter: Filter | Filter[] | undefined, event: AnalyticsEvent): boolean;
//# sourceMappingURL=filters.d.ts.map
