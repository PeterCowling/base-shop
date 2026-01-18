type EventPayload = {
    type: string;
    [key: string]: unknown;
};
export declare function logAnalyticsEvent(event: EventPayload): Promise<void>;
export {};
