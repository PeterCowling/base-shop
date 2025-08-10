// packages/platform-core/src/shipping/types.ts

export interface ShippingAddress {
  postalCode: string;
  country: string;
}

export interface ShippingRateRequest {
  from: ShippingAddress;
  to: ShippingAddress;
  weight: number; // weight in kilograms
}
