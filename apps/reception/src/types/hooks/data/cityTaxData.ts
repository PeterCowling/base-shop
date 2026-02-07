/* File: /src/types/hooks/data/cityTaxData.ts */

import type { CityTaxData, CityTaxRecord } from "../../../schemas/cityTaxSchema";

export type { CityTaxData, CityTaxRecord };

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
