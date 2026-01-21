// src/types/hooks/data/safeCountData.ts

/**
 * Represents a single entry in the "safeCounts" node.
 */

export type SafeCountType =
  | "deposit"
  | "withdrawal"
  | "pettyWithdrawal"
  | "exchange"
  | "bankDeposit"
  | "bankWithdrawal"
  | "opening"
  | "safeReset"
  | "reconcile"
  | "safeReconcile";

export interface SafeCount {
  id?: string;
  user: string;
  timestamp: string;
  type: SafeCountType;
  /** Total counted cash when type === "safeReconcile" */
  count?: number;
  /** Difference vs expected when type === "safeReconcile" */
  difference?: number;
  /** Total counted keycards when applicable (deposits, bank drops, reconciles) */
  keycardCount?: number;
  /** Difference vs expected keycards when provided */
  keycardDifference?: number;
  /** Total amount involved in the transaction; required for exchanges */
  amount?: number;
  /** Denomination breakdown for deposit/withdrawal or incoming/outgoing for exchange */
  denomBreakdown?:
    | Record<string, number>
    | { incoming: Record<string, number>; outgoing: Record<string, number> };
  /** Direction of cash movement when type === "exchange"; required for exchanges */
  direction?: "drawerToSafe" | "safeToDrawer";
}

/**
 * The complete "safeCounts" node, where each key is a countId
 * mapped to its SafeCount record.
 */
export type SafeCounts = Record<string, SafeCount> | null;
