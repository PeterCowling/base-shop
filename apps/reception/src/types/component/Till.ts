/* src/types/component/Till.ts */

// src/types/component/Till.ts

/**
 * Represents a single till transaction. Transactions record basic payment
 * information such as the identifier, timestamp, amount, method and optional
 * descriptors. Additional properties are included to cover booking references,
 * user identifiers and item categorisation. All fields other than `txnId`
 * and `amount` are optional to allow partial records.
 */
export interface Transaction {
  txnId: string;
  timestamp?: string;
  amount: number;
  method?: string;
  description?: string;
  user_name?: string;
  occupantId?: string;
  bookingRef?: string;
  type?: string;
  itemCategory?: string;
  count?: number;
  nonRefundable?: boolean;
  docType?: string;
  /** Indicates that this transaction relates to a keycard. */
  isKeycard?: boolean;
}

/**
 * Properties accepted by the `ShiftSummary` component. Each monetary
 * property is a plain number rather than a formatted string to allow
 * consistent currency formatting within the component. Counts and totals
 * reflect the current state of the shift.
 */
export interface ShiftSummaryProps {
  /** Timestamp marking when the shift was opened. `null` indicates that
   * no shift is currently active and the component should render nothing. */
  shiftOpenTime: Date | null;
  /** Name of the user who opened the shift. `null` is handled as
   * "Unknown" for display purposes. */
  shiftOwner: string | null;
  /** Cash on hand at the start of the shift. */
  openingCash: number;
  /** Final cash count recorded at close. A value of `0` indicates that
   * the closing cash row should be omitted. */
  finalCashCount: number;
  /** Net cash received during the shift. */
  netCash: number;
  /** Net credit card revenue during the shift. */
  netCC: number;
  /** Total value of credit slips issued during this shift. */
  creditSlipTotal: number;
  /** Number of document deposits taken during the shift. */
  docDepositsCount: number;
  /** Number of document returns processed during the shift. */
  docReturnsCount: number;
  /** Count of keycards loaned out during the shift. */
  keycardsLoaned: number;
  /** Count of keycards returned during the shift. */
  keycardsReturned: number;
  /** Expected amount of cash that should be present at the close of the shift. */
  expectedCashAtClose: number;
  /** Keycards in till at the start of the shift. */
  openingKeycards: number;
  /** Final keycard count recorded at close or reconcile. */
  finalKeycardCount: number;
  /** Expected number of keycards at the end of the shift. */
  expectedKeycardsAtClose: number;
}

/**
 * Properties for the open shift form. Consumers should provide lists of
 * credit card transactions and a callback to be invoked when the user
 * confirms the opening. */
export interface OpenShiftFormProps {
  ccTransactionsFromLastShift: Transaction[];
  previousFinalCash: number;
  onConfirm: (
    calculatedCash: number,
    allReceiptsConfirmed: boolean,
    openingKeycards: number,
    breakdown: Record<string, number>
  ) => void;
  onCancel: () => void;
}

/**
 * Properties for the close shift form. Consumers should provide the list of
 * credit card transactions collected during the current shift and callbacks
 * for confirmation and cancellation. */
export interface CloseShiftFormProps {
  /**
   * Behaviour variant. "close" performs a standard shift close while
   * "reconcile" mirrors the former `ReconcileShiftForm` logic.
   */
  variant: "close" | "reconcile";
  ccTransactionsFromThisShift: Transaction[];
  expectedCashAtClose: number;
  expectedKeycardsAtClose: number;
  onConfirm: (
    countedCash: number,
    countedKeycards: number,
    allReceiptsConfirmed: boolean,
    breakdown: Record<string, number>
  ) => void;
  onCancel: () => void;
}

/**
 * A denomination has a label and a monetary value. Denominations are used for
 * presenting available coins and notes for counting cash. Values are given
 * in euros to align with the currency used by the till. */
export interface Denomination {
  label: string;
  value: number;
}

/**
 * Shared euro denominations (excluding 1c and 2c, and 200/500 notes). These
 * definitions are exported as a constant to provide a single source of
 * truth for all components that need to display or calculate cash amounts.
 */
export const DENOMINATIONS: Denomination[] = [
  { label: "5c coins", value: 0.05 },
  { label: "10c coins", value: 0.1 },
  { label: "20c coins", value: 0.2 },
  { label: "50c coins", value: 0.5 },
  { label: "€1 coins", value: 1 },
  { label: "€2 coins", value: 2 },
  { label: "€5 notes", value: 5 },
  { label: "€10 notes", value: 10 },
  { label: "€20 notes", value: 20 },
  { label: "€50 notes", value: 50 },
  { label: "€100 notes", value: 100 },
];

/**
 * Represents a credit slip issued during shift closing. Each slip is
 * identified by a number and records the time, amount and the user who
 * recorded the slip. */
export interface CreditSlip {
  /** Unique slip number or reference */
  slipNumber: string;
  /** Timestamp in ISO format when the slip was recorded */
  timestamp: string;
  /** Monetary value of the slip */
  amount: number;
  /** User who entered the slip */
  user: string;
}
