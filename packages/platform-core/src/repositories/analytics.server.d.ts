import type { AnalyticsAggregates } from "../analytics";
export declare function listEvents(_shop?: string): Promise<any[]>;
export declare function readAggregates(shop: string): Promise<AnalyticsAggregates>;
