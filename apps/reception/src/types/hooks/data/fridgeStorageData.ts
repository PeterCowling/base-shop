// src/types/hooks/data/fridgeStorageData.ts

/**
 * Represents occupant data for fridge storage.
 *
 * Example:
 *   "occ_1741690203417": {
 *     "used": true
 *   }
 */
export interface FridgeStorageRecord {
  used: boolean;
}

/**
 * The entire "fridgeStorage" node, where each key is an occupantId
 * mapped to its FridgeStorageRecord.
 *
 * Example:
 *   "fridgeStorage": {
 *     "occ_1741690203417": {
 *       "used": true
 *     }
 *   }
 */
export interface FridgeStorage {
  [occupantId: string]: FridgeStorageRecord;
}
