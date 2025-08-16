import type { RentalOrder } from "@acme/types";
interface ReverseLogisticsEvent {
    sessionId: string;
    status: NonNullable<RentalOrder["status"]>;
}
export declare function writeReverseLogisticsEvent(shop: string, sessionId: string, status: ReverseLogisticsEvent["status"], dataRoot?: string): Promise<void>;
export declare function processReverseLogisticsEventsOnce(shopId?: string, dataRoot?: string): Promise<void>;
type ReverseLogisticsConfig = {
    enabled: boolean;
    /** Interval in minutes between service runs */
    intervalMinutes: number;
};
export declare function startReverseLogisticsService(configs?: Record<string, Partial<ReverseLogisticsConfig>>, dataRoot?: string): Promise<() => void>;
export {};
