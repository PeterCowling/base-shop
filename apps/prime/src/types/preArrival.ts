// /src/types/preArrival.ts

/**
 * Pre-arrival data stored per occupant in Firebase.
 * Path: preArrival/{uuid}
 *
 * This tracks guest readiness for arrival: route planning, ETA confirmation,
 * cash preparation, and checklist progress. Data is scoped to the current
 * booking and helps staff prepare for arrivals.
 */
import type { IndexedById } from './indexedById';

/**
 * Travel method for arriving at the hostel.
 * Used for ETA confirmation and route tracking.
 */
export type EtaMethod = 'ferry' | 'bus' | 'taxi' | 'private' | 'train' | 'other';

/**
 * Guest arrival state based on check-in/checkout dates and check-in status.
 * Determines which UI mode to show (readiness dashboard vs arrival vs normal).
 */
export type GuestArrivalState =
  | 'pre-arrival'   // Before check-in date
  | 'arrival-day'   // On check-in date, not yet checked in
  | 'checked-in'    // After check-in, during stay
  | 'checked-out';  // After checkout date

/**
 * Progress on the pre-arrival readiness checklist.
 * Each item is a self-attestation by the guest.
 */
export interface ChecklistProgress {
  /** Guest has viewed/saved a route to the hostel */
  routePlanned: boolean;
  /** Guest has confirmed their arrival time */
  etaConfirmed: boolean;
  /** Guest has confirmed they have cash for city tax and deposit */
  cashPrepared: boolean;
  /** Guest has reviewed the house rules */
  rulesReviewed: boolean;
  /** Guest has saved the hostel location (maps/address) */
  locationSaved: boolean;
}

/**
 * Pre-arrival data for a single guest/occupant.
 *
 * @property etaWindow - Expected arrival time in HH:MM format (e.g., "18:00")
 * @property etaMethod - How the guest is traveling (ferry, bus, etc.)
 * @property etaNote - Optional free-text note about arrival (max 200 chars)
 * @property etaConfirmedAt - Timestamp when ETA was confirmed (null if not yet)
 * @property cashReadyCityTax - Guest confirms they have cash for city tax
 * @property cashReadyDeposit - Guest confirms they have cash for deposit
 * @property routeSaved - Slug of saved route (from how-to-get-here content)
 * @property checklistProgress - Individual checklist item completion states
 * @property updatedAt - Timestamp of last update
 */
export interface PreArrivalData {
  etaWindow: string | null;
  etaMethod: EtaMethod | null;
  etaNote: string;
  etaConfirmedAt: number | null;
  cashReadyCityTax: boolean;
  cashReadyDeposit: boolean;
  routeSaved: string | null;
  checklistProgress: ChecklistProgress;
  updatedAt: number;
}

/**
 * Default values for pre-arrival data.
 * Applied when pre-arrival record doesn't exist yet.
 */
export const DEFAULT_PRE_ARRIVAL: PreArrivalData = {
  etaWindow: null,
  etaMethod: null,
  etaNote: '',
  etaConfirmedAt: null,
  cashReadyCityTax: false,
  cashReadyDeposit: false,
  routeSaved: null,
  checklistProgress: {
    routePlanned: false,
    etaConfirmed: false,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  },
  updatedAt: 0,
};

/**
 * Weights for computing readiness score from checklist progress.
 * Total adds up to 100.
 */
export const CHECKLIST_WEIGHTS: Record<keyof ChecklistProgress, number> = {
  routePlanned: 25,
  etaConfirmed: 20,
  cashPrepared: 25,
  rulesReviewed: 15,
  locationSaved: 15,
};

/**
 * Top-level preArrival node in Firebase.
 * preArrival => { uuid => PreArrivalData }
 */
export type PreArrivalRecords = IndexedById<PreArrivalData>;
