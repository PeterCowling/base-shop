/* File: /src/hooks/client/cityTax/useCityTaxPayment.ts */

import { useCallback } from "react";

import { CityTaxTransaction } from "../../../types/domains/cityTaxDomain";
import { CityTaxRecord } from "../../../types/hooks/data/cityTaxData";
import { getCurrentIsoTimestamp } from "../../../utils/dateUtils";

interface CityTaxPaymentResult {
  newTotalPaid: number;
  newBalance: number;
}

/**
 * Client hook containing pure city-tax-related calculations
 * without performing any data mutations or I/O.
 */
export function useCityTaxPayment() {
  /**
   * Calculates new totalPaid and balance values given
   * the occupant's current city tax record and the payment.
   */
  const calculateCityTaxUpdate = useCallback(
    (occupantTax: CityTaxRecord, payment: number): CityTaxPaymentResult => {
      const oldPaid = occupantTax.totalPaid || 0;
      const totalDue = occupantTax.totalDue || 0;
      const newTotalPaid = oldPaid + payment;
      const newBalance = totalDue - newTotalPaid;

      return {
        newTotalPaid,
        newBalance,
      };
    },
    []
  );

  /**
   * Builds a new transaction object for a city-tax payment.
   */
  const buildCityTaxTransaction = useCallback(
    (payment: number): CityTaxTransaction => ({
      amount: payment,
      type: "taxPayment",
      timestamp: getCurrentIsoTimestamp(),
    }),
    []
  );

  return {
    calculateCityTaxUpdate,
    buildCityTaxTransaction,
  };
}
