import "server-only";
import type { Shop } from "@acme/types";
import type { Order } from "./utils";
export declare function listOrders(shop: string): Promise<Order[]>;
export declare const readOrders: typeof listOrders;
export declare function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  returnDueDate?: string,
  customerId?: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean,
): Promise<Order>;
export declare function getOrdersForCustomer(shop: string, customerId: string): Promise<Order[]>;
