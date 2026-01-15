// /src/types/bagStorage.ts

/**
 * The entire "bagStorage" node in Firebase:
 * occupant_id => BagStorageRecord
 *
 * occupant_id is typically something like "occ_1741690203417".
 */
import type { IndexedById } from './indexedById';

/**
 * Bag storage information for a single occupant.
 *
 * isEligible: Indicates if the occupant is eligible for bag storage.
 * optedIn: Indicates if the occupant has chosen to participate in bag storage.
 */
export interface BagStorageRecord {
  optedIn: boolean;
}

export type BagStorage = IndexedById<BagStorageRecord>;
