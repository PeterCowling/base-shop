// packages/platform-core/src/tax/types.ts
export interface TaxAddress {
  postalCode: string;
  country: string;
}

export interface TaxRequest {
  amount: number; // subtotal amount for taxation
  to: TaxAddress;
}
