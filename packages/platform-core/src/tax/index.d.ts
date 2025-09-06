export interface TaxCalculationRequest {
  provider: "taxjar";
  amount: number;
  toCountry: string;
  toPostalCode?: string;
}

export interface TaxCalculationResult {
  tax: number;
}

export declare function getTaxRate(region: string): Promise<number>;
export declare function calculateTax({ provider, ...payload }: TaxCalculationRequest): Promise<TaxCalculationResult>;
