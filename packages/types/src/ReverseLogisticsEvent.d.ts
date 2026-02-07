export type ReverseLogisticsEventName = "received" | "cleaning" | "repair" | "qa" | "available";
export interface ReverseLogisticsEvent {
    id: string;
    shop: string;
    sessionId: string;
    event: ReverseLogisticsEventName;
    createdAt: string;
}
//# sourceMappingURL=ReverseLogisticsEvent.d.ts.map