// /src/types/preorder.ts
import type { IndexedById } from './indexedById';

/**
 * Nightly preorder detail for a single occupant.
 */
export interface PreorderNightData {
  night: string;
  breakfast: string;
  drink1: string;
  drink2: string;
  /** ISO YYYY-MM-DD service date for this night */
  serviceDate?: string;
  /** Optional id field that may come from array source */
  id?: string | number;
  /** txnId of the placed breakfast bar order (backref; breakfast field is NOT overwritten) */
  breakfastTxnId?: string;
  /** Original pipe-delimited breakfast order string for human-readable display */
  breakfastText?: string;
  /** txnId of the placed evening drink bar order (drink1 field is NOT overwritten) */
  drink1Txn?: string;
  /** Original pipe-delimited drink order string for human-readable display */
  drink1Text?: string;
}

/**
 * occupant_id =>
 *    night_key => PreorderNightData
 */
export type PreorderOccupantRecord = IndexedById<PreorderNightData>;

/**
 * The entire "preorder" node in Firebase:
 * occupant_id => PreorderOccupantRecord
 */
export type Preorder = IndexedById<PreorderOccupantRecord>;

export interface PreordersDataRecord {
  [occupantId: string]: {
    [nightKey: string]: PreorderNightData;
  };
}

/**
 * Processed preorder with id for use in components.
 */
export interface ProcessedPreorder {
  id: string;
  night: string;
  breakfast: string;
  drink1: string;
  drink2: string;
}
