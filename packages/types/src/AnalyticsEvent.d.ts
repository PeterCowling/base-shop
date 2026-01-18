export interface AnalyticsEvent {
    type: string;
    campaign?: string;
    email?: string;
    segment?: string;
    timestamp?: string;
    page?: string;
    orderId?: string;
    amount?: number;
    code?: string;
    [key: string]: unknown;
}
//# sourceMappingURL=AnalyticsEvent.d.ts.map