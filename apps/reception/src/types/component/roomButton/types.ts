// File: /src/components/checkins/roomButton/types.ts

/** Payment types that are allowed. */
export type PaymentType = "CASH" | "CC";

/** Represents one payment split, including amount and payment method. */
export interface PaymentSplit {
  /** Unique identifier for this split row. */
  id: string;
  amount: number; // Always kept to two decimals
  payType: PaymentType;
}
