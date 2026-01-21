import "server-only";

import type { RentalOrder } from "@acme/types";

type Order = RentalOrder;

export declare function updateStatus(
  shop: string,
  sessionId: string,
  status: NonNullable<Order["status"]>,
  extra?: Record<string, unknown>,
): Promise<Order | null>;

export declare function markReceived(
  shop: string,
  sessionId: string,
): Promise<Order | null>;

export declare function markCleaning(
  shop: string,
  sessionId: string,
): Promise<Order | null>;

export declare function markRepair(
  shop: string,
  sessionId: string,
): Promise<Order | null>;

export declare function markQa(
  shop: string,
  sessionId: string,
): Promise<Order | null>;

export declare function markAvailable(
  shop: string,
  sessionId: string,
): Promise<Order | null>;

export declare function markLateFeeCharged(
  shop: string,
  sessionId: string,
  amount: number,
): Promise<Order | null>;
