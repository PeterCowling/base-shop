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
  /** Optional id field that may come from array source */
  id?: string | number;
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
