import "server-only";

import type { Order } from "./utils";

export declare function markNeedsAttention(shop: string, sessionId: string): Promise<Order | null>;
export declare function updateRisk(
  shop: string,
  sessionId: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean,
): Promise<Order | null>;
