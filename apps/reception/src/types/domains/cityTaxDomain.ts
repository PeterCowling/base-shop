// /src/types/domains/cityTaxDomain.ts

import { type CityTaxData } from "../hooks/data/cityTaxData";

export type { PayType } from "../hooks/data/cityTaxData";

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
