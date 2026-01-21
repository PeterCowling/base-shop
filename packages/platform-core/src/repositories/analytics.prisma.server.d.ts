import "server-only";

import type { AnalyticsAggregates, AnalyticsEvent } from "../analytics";

export declare function listEvents(_shop?: string): Promise<AnalyticsEvent[]>;
export declare function readAggregates(shop: string): Promise<AnalyticsAggregates>;
export declare const prismaAnalyticsRepository: {
  listEvents: typeof listEvents;
  readAggregates: typeof readAggregates;
};
