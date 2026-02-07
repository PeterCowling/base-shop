/* File: /src/hooks/client/useComputeOutstandingCityTax.ts */

import { useCallback } from "react";

import { type CityTaxRecord, type PayType } from "../../../types/hooks/data/cityTaxData";

/**
 * Client hook that returns a function for computing
 * outstanding city tax based on occupant's data & payType.
 */
export default function useComputeOutstandingCityTax() {
  const computeOutstandingCityTax = useCallback(
    (occupantTax: CityTaxRecord | undefined, payType: PayType): number => {
      if (!occupantTax || occupantTax.balance <= 0) return 0;

      // Example: if paying by credit card, multiply the balance for some extra fee.
      if (payType === "CC") {
        const fee = occupantTax.balance * 1.8; // hypothetical surcharge
        return parseFloat(fee.toFixed(2));
      }

      return occupantTax.balance;
    },
    []
  );

  return { computeOutstandingCityTax };
}
