// /Users/petercowling/reception/src/types/component/checkoutrow.ts
import { type FinancialsRoomData } from "../hooks/data/financialsRoomData";
import { type LoanTransaction } from "../hooks/data/loansData";

/**
 * Represents an activity related to the checkout process.
 * Extend this interface with additional properties as needed.
 */
export interface Activity {
  code: number;
  timestamp?: string;
}

/**
 * Final shape of a checkout row
 */
export interface CheckoutRow {
  bookingRef: string;
  occupantId: string;
  checkOutDate: string;
  checkOutTimestamp: number | null;
  firstName: string;
  lastName: string;
  rooms: string[];
  financials: FinancialsRoomData;
  loans: Record<string, LoanTransaction>;
  activities: Activity[];
  citizenship: string;
  placeOfBirth: string;
  dateOfBirth: string | null;
  municipality: string;
  gender: string;
  isCompleted: boolean;
}
