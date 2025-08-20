import "server-only";
export type ReverseLogisticsEventName = "received" | "cleaning" | "repair" | "qa" | "available";
export type ReverseLogisticsEvent = {
    id: string;
    shop: string;
    sessionId: string;
    event: ReverseLogisticsEventName;
    createdAt: string;
};
export declare function recordEvent(shop: string, sessionId: string, event: ReverseLogisticsEventName, createdAt?: string): Promise<void>;
export declare function listEvents(shop: string): Promise<ReverseLogisticsEvent[]>;
export declare const reverseLogisticsEvents: {
    received: (shop: string, sessionId: string, createdAt?: string) => Promise<void>;
    cleaning: (shop: string, sessionId: string, createdAt?: string) => Promise<void>;
    repair: (shop: string, sessionId: string, createdAt?: string) => Promise<void>;
    qa: (shop: string, sessionId: string, createdAt?: string) => Promise<void>;
    available: (shop: string, sessionId: string, createdAt?: string) => Promise<void>;
};
//# sourceMappingURL=reverseLogisticsEvents.server.d.ts.map