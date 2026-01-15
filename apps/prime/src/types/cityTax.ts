// File: /src/types/cityTax.ts
/**
 * CityTaxRecord
 * Represents all city tax records for a particular bookingReference.
 *
 * Structure in Firebase: cityTax/{bookingReference}/{occupantId}
 *
 * Example:
 * cityTax: {
 *   "4092716050": {
 *     "occ_1740508445159": {
 *       "balance": 15,
 *       "totalDue": 15,
 *       "totalPaid": 0
 *     }
 *   }
 * }
 *
 * Each occupantId has an object with their city tax details.
 */
export interface CityTaxOccupantRecord {
  balance: number;
  totalDue: number;
  totalPaid: number;
}

export type CityTaxRecord = Record<string, CityTaxOccupantRecord>;

/**
 * This interface extends the entire city tax booking record (for all occupants),
 * keyed by occupantId:
 */
export type CityTaxBookingRecord = CityTaxRecord;
