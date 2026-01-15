/* File: /src/types/hooks/data/cityTaxData.ts */

// -----------------------------------------------------
// CityTaxRecord: Represents the minimal city tax record
// required by the data hook.
//
// Example structure:
// balance: 15   -> Remaining city tax owed
// totalDue: 15  -> Total city tax initially assessed
// totalPaid: 0  -> Sum of all payments toward the city tax
// -----------------------------------------------------
export interface CityTaxRecord {
  balance: number;
  totalDue: number;
  totalPaid: number;
}

// -----------------------------------------------------
// CityTaxByOccupant: Collection of city tax records
// keyed by occupantId.
//
// Example structure:
// {
//   "occ_1740508445159": { balance: 15, totalDue: 15, totalPaid: 0 },
//   "occ_1740508445160": { balance: 10, totalDue: 20, totalPaid: 10 }
// }
// -----------------------------------------------------
export type CityTaxByOccupant = Record<string, CityTaxRecord>;

// -----------------------------------------------------
// CityTaxData: Overall city tax data, keyed by
// bookingRef -> occupantId -> CityTaxRecord.
//
// Example structure:
// {
//   "4092716050": {
//     "occ_1740508445159": { balance: 15, totalDue: 15, totalPaid: 0 }
//   },
//   "DT1PO8": {
//     "occ_1740508445160": { balance: 10, totalDue: 20, totalPaid: 10 }
//   }
// }
// -----------------------------------------------------
export type CityTaxData = Record<string, CityTaxByOccupant>;

/**
 * PayType: Specifies the method of payment
 * used for the city tax.
 *
 * Example usage:
 *   if (payType === "CC") {
 *     // Apply a credit card surcharge
 *   } else {
 *     // No surcharge for other methods
 *   }
 */
export type PayType = "CC" | "CASH";
