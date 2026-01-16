// /src/types/domains/cityTaxDomain.ts

import { CityTaxData } from "../hooks/data/cityTaxData";

/**
 * Payment types for occupant's city tax.
 */
export type PayType = "CASH" | "CC";

/**
 * Represents a transaction (taxPayment, etc.) for city tax.
 */
export interface CityTaxTransaction {
  /** Amount of tax paid in this transaction */
  amount: number;
  /** Type of transaction (e.g. "taxPayment") */
  type: string;
  /** ISO timestamp of the transaction */
  timestamp: string;
}

/**
 * Interface representing the hook result for useCityTax.
 */
export interface UseCityTaxResult {
  cityTax: CityTaxData;
  loading: boolean;
  error: unknown;
}
