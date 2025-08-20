import "server-only";
import type { RentalOrder } from "@acme/types";
export { listOrders as readOrders, addOrder, markReturned, markRefunded, updateRisk, setReturnTracking, } from "../orders.js";
type Order = RentalOrder;
export declare const markReceived: (shop: string, sessionId: string) => Promise<Order | null>;
export declare const markCleaning: (shop: string, sessionId: string) => Promise<Order | null>;
export declare const markRepair: (shop: string, sessionId: string) => Promise<Order | null>;
export declare const markQa: (shop: string, sessionId: string) => Promise<Order | null>;
export declare const markAvailable: (shop: string, sessionId: string) => Promise<Order | null>;
export declare function markLateFeeCharged(shop: string, sessionId: string, amount: number): Promise<Order | null>;
//# sourceMappingURL=rentalOrders.server.d.ts.map