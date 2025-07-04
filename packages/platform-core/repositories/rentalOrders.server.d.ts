import "server-only";
import { type RentalOrder } from "../../types/src";
export declare function readOrders(shop: string): Promise<RentalOrder[]>;
export declare function writeOrders(shop: string, orders: RentalOrder[]): Promise<void>;
export declare function addOrder(shop: string, sessionId: string, deposit: number, expectedReturnDate?: string): Promise<RentalOrder>;
export declare function markReturned(shop: string, sessionId: string, damageFee?: number): Promise<RentalOrder | null>;
export declare function markRefunded(shop: string, sessionId: string): Promise<RentalOrder | null>;
//# sourceMappingURL=rentalOrders.server.d.ts.map