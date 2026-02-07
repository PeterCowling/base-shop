/**
 * Centralized types for financialsRoom mutations
 */

export interface RoomTransaction {
  occupantId?: string;
  amount: number;
  nonRefundable?: boolean;
  timestamp: string;
  /**
   * Allow "charge", "payment", "refund", or any custom string.
   * If you only allow these three, remove "| string".
   */
  type?: "charge" | "payment" | "refund" | string;
  bookingRef?: string;
  shiftId?: string;
  sourceTxnId?: string;
  correctionReason?: string;
  correctionKind?: "reversal" | "replacement" | "adjustment";
  correctedBy?: string;
  correctedByUid?: string;
  correctedShiftId?: string;
  voidedAt?: string;
  voidedBy?: string;
  voidedByUid?: string;
  voidReason?: string;
  voidedShiftId?: string;
}

/**
 * FinancialsRoomData
 * Data stored at `financialsRoom/{bookingRef}` in Firebase.
 */
export interface FinancialsRoomData {
  balance: number;
  totalDue: number;
  totalPaid: number;
  transactions: Record<string, RoomTransaction>;
}
