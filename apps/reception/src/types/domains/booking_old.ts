/* src/types/domains/booking_old.ts */
import { type Activity } from "../hooks/data/activitiesData";
import { type CityTaxData } from "../hooks/data/cityTaxData";
import { type FinancialsRoomData } from "../hooks/data/financialsRoomData";
import { type GuestByRoomRecord } from "../hooks/data/guestByRoomData";
import {
  type BookingOccupantDetails,
  type OccupantDetails,
} from "../hooks/data/guestDetailsData";
import { type LoanTransaction } from "../hooks/data/loansData";
import { type PreorderData } from "../hooks/data/preorderData";

/**
 * Provide an alias for FinancialsRoomData so you can import `Financials`.
 */
export type Financials = FinancialsRoomData;

/**
 * Occupant-level container: each occupant can have many transactions.
 * This references the LoanTxn type from "loansData.ts".
 */
export interface OccupantLoans {
  txns?: Record<string, LoanTransaction>;
}

/**
 * A higher-level "Booking" interface used in certain parts of the codebase.
 */
export interface Bookings {
  bookingRef: string;
  occupantId: string;
  firstName?: OccupantDetails["firstName"];
  lastName?: OccupantDetails["lastName"];
  roomBooked?: GuestByRoomRecord["booked"];
  roomAllocated?: GuestByRoomRecord["allocated"];
  financials?: FinancialsRoomData;
  cityTax?: CityTaxData;
  loans?: Record<string, OccupantLoans>;
  activity?: Record<string, Activity>;
  isFirstForBooking?: boolean;
  mealPlans?: PreorderData;
  notes?: string;
  occupantDetails?: BookingOccupantDetails;
}

/**
 * If you also want to keep the old style of re-exporting LoanTxn as `BookingLoanTxn`:
 */
export type { LoanTransaction as BookingLoanTxn } from "../hooks/data/loansData";
