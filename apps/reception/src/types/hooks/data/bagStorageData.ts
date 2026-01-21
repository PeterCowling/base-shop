// src/types/hooks/data/bagStorageData.ts

/**
 * Represents occupant data for bag storage.
 *
 * Example:
 *   "occ_1741690203417": {
 *     "optedIn": true
 *   }
 */
export interface BagStorageRecord {
  optedIn: boolean;
}

/**
 * The entire "bagStorage" node, where each key is an occupantId
 * mapped to its BagStorageRecord.
 *
 * Example:
 *   "bagStorage": {
 *     "occ_1741690203417": {
 *       "optedIn": true
 *     }
 *   }
 */
export interface BagStorage {
  [occupantId: string]: BagStorageRecord;
}
