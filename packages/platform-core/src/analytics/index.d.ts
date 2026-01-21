import "server-only";

import type { AnalyticsEvent } from "@acme/types";

export type { AnalyticsEvent };
export interface AnalyticsProvider {
    track(event: AnalyticsEvent): Promise<void> | void;
}
export declare function trackEvent(shop: string, event: AnalyticsEvent): Promise<void>;
export declare function trackPageView(shop: string, page: string): Promise<void>;
export declare function trackOrder(shop: string, orderId: string, amount?: number): Promise<void>;
interface Aggregates {
    page_view: Record<string, number>;
    order: Record<string, {
        count: number;
        amount: number;
    }>;
    discount_redeemed: Record<string, Record<string, number>>;
    ai_crawl: Record<string, number>;
}
export type AnalyticsAggregates = Aggregates;
