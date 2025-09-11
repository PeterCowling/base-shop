import "server-only";
import type { Order } from "./utils";
export declare function markRefunded(
  shop: string,
  sessionId: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean,
): Promise<Order | null>;
export declare function refundOrder(shop: string, sessionId: string, amount?: number): Promise<Order | null>;
