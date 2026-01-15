// src/types/hooks/data/cashCountData.ts

/**
 * Represents a single entry in the "cashCounts" node.
 *
 * Example:
 *   "cashCounts": {
 *     "-OKbB8xH8eq_8jcjJqYU": {
 *       "count": 20,
 *       "difference": 0,
 *       "timestamp": "2025-05-03T17:43:14.000+02:00",
 *       "type": "opening",
 *       "user": "Pete"
 *     }
 *   }
 */

export type CashCountType =
  | "opening"
  | "close"
  | "reconcile"
  | "float"
  | "floatEntry"
  | "tenderRemoval";

export interface CashCount {
  user: string;
  timestamp: string;
  type: CashCountType;
  /** Total count of cash in till for opening/close/reconcile */
  count?: number;
  /** Difference vs previous count for opening/close/reconcile */
  difference?: number;
  /** Map of denomination value -> quantity */
  denomBreakdown?: Record<string, number>;
  /** Number of keycards counted during shift actions */
  keycardCount?: number;
  /** Amount of float added when type === "float" */
  amount?: number;
}

/**
 * The complete "cashCounts" node, where each key is a countId
 * mapped to its CashCount record.
 */
export type CashCounts = Record<string, CashCount> | null;
