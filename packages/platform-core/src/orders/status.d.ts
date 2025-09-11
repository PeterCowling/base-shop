import "server-only";
import type { Order } from "./utils";
export declare function markFulfilled(shop: string, sessionId: string): Promise<Order>;
export declare function markShipped(shop: string, sessionId: string): Promise<Order>;
export declare function markDelivered(shop: string, sessionId: string): Promise<Order>;
export declare function markCancelled(shop: string, sessionId: string): Promise<Order>;
export declare function markReturned(shop: string, sessionId: string, damageFee?: number): Promise<Order | null>;
export declare function setReturnTracking(shop: string, sessionId: string, trackingNumber: string, labelUrl: string): Promise<Order | null>;
export declare function setReturnStatus(shop: string, trackingNumber: string, returnStatus: string): Promise<Order | null>;
